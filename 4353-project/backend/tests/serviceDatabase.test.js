const { spawn } = require('node:child_process');
const path = require('node:path');
const { once } = require('node:events');
const request = require('supertest');
const db = require('../db/pool');
const app = require('../app');
const service = require('../services/serviceService');
const repository = require('../repositories/serviceRepository');
const queue = require('../services/queueService');
const { migrate } = require('../db/migrate');
const { seed } = require('../db/seed');

const valid = { name: 'Advising', description: 'Academic planning', durationMin: 20, priority: 'medium' };

async function startBackend() {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((resolve, reject) => {
    let output = '';
    let errors = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Backend startup timed out')); }, 10000);
    child.stderr.on('data', (data) => { errors += data; });
    child.on('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Backend exited ${code}: ${errors}`)); });
    child.stdout.on('data', (data) => {
      output += data;
      const match = output.match(/http:\/\/localhost:(\d+)/);
      if (match) { clearTimeout(timer); resolve({ child, url: `http://127.0.0.1:${match[1]}` }); }
    });
  });
}

async function stopBackend(server) {
  const exited = once(server.child, 'exit');
  server.child.kill('SIGTERM');
  await exited;
}

test('database owns IDs and rejects simultaneous case-insensitive duplicate names', async () => {
  const results = await Promise.allSettled([
    service.createService(valid),
    service.createService({ ...valid, name: ' ADVISING ' }),
  ]);
  expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
  expect(results.find((result) => result.status === 'rejected').reason.statusCode).toBe(409);
  expect((await service.listServices()).filter((item) => item.name.toLowerCase() === 'advising')).toHaveLength(1);
});

test.each([
  ['name', ''], ['name', '   '], ['name', 'x'.repeat(101)], ['name', null],
  ['description', ''], ['description', 'x'.repeat(501)], ['description', null],
  ['expectedDuration', 0], ['expectedDuration', 481], ['expectedDuration', null],
  ['priorityLevel', 'urgent'], ['priorityLevel', null], ['status', 'paused'], ['status', null],
])('database rejects invalid %s even when application validation is bypassed', async (column, value) => {
  await expect(db.query(`UPDATE "Service" SET "${column}" = $1 WHERE "serviceId" = 1`, [value]))
    .rejects.toMatchObject({ code: expect.stringMatching(/^(23502|23514|22001)$/) });
  expect((await service.getServiceById(1)).name).toBe('Student Inquiries');
});

test('parameterized queries store SQL-like text as text', async () => {
  const name = "Help'); DROP TABLE service; --";
  const created = await service.createService({ ...valid, name });
  expect((await service.getServiceById(created.id)).name).toBe(name);
  expect(await service.listServices()).toHaveLength(4);
});

test('independent partial updates preserve both changes', async () => {
  await Promise.all([
    service.updateService(1, { name: 'New name' }),
    service.updateService(1, { durationMin: 22 }),
  ]);
  expect(await service.getServiceById(1)).toMatchObject({ name: 'New name', durationMin: 22 });
});

test('large positive ids produce 404 rather than a PostgreSQL integer error', async () => {
  await expect(service.getServiceById(2147483648)).rejects.toMatchObject({ statusCode: 404 });
  await expect(service.updateService(2147483648, { status: 'closed' })).rejects.toMatchObject({ statusCode: 404 });
});

test('repeated migration and seed do not overwrite edited services', async () => {
  await service.updateService(1, { name: 'Renamed service' });
  await migrate();
  await seed();
  expect((await service.getServiceById(1)).name).toBe('Renamed service');
  expect((await db.query('SELECT * FROM schema_migrations')).rows).toHaveLength(1);
});

test('queues read updated duration, status and new services from the database', async () => {
  queue.resetQueues();
  const created = await service.createService(valid);
  expect(await queue.joinQueue(2, created.id)).toMatchObject({ estimatedWaitMin: 20 });
  await service.updateService(created.id, { durationMin: 35, status: 'closed' });
  expect((await queue.getCurrentQueue(2)).currentQueue.estimatedWaitMin).toBe(35);
  await expect(queue.joinQueue(3, created.id)).rejects.toMatchObject({ statusCode: 409 });
  expect(await queue.getQueueSummaries()).toContainEqual({ serviceId: created.id, queueLength: 1, estimatedWaitMin: 70 });
});

test('real login token authorizes admin writes and denies regular users', async () => {
  const admin = await request(app).post('/api/auth/login').send({ email: 'admin@queuesmart.test', password: 'Queue123!' });
  const user = await request(app).post('/api/auth/login').send({ email: 'user@queuesmart.test', password: 'Queue123!' });
  expect((await request(app).post('/api/services').set('Authorization', `Bearer ${admin.body.token}`).send(valid)).status).toBe(201);
  expect((await request(app).put('/api/services/1').set('Authorization', `Bearer ${user.body.token}`).send({ status: 'closed' })).status).toBe(403);
});

test('database failures reach the JSON error handler without exposing SQL details', async () => {
  const query = jest.spyOn(repository, 'list').mockRejectedValueOnce(new Error('private database detail'));
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const response = await request(app).get('/api/services');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Internal server error' });
  } finally { query.mockRestore(); log.mockRestore(); }
});

test('create and update survive a full backend process restart', async () => {
  await db.close();
  let server = await startBackend();
  try {
    const login = await request(server.url).post('/api/auth/login').send({ email: 'admin@queuesmart.test', password: 'Queue123!' });
    const token = login.body.token;
    const created = await request(server.url).post('/api/services').set('Authorization', `Bearer ${token}`).send(valid);
    expect(created.status).toBe(201);
    const edited = await request(server.url).put(`/api/services/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`).send({ name: 'Persisted advising', durationMin: 27, status: 'closed' });
    expect(edited.status).toBe(200);
    await stopBackend(server);
    server = await startBackend();
    const list = await request(server.url).get('/api/services');
    expect(list.status).toBe(200);
    expect(list.body).toContainEqual(edited.body);
    const next = await request(server.url).post('/api/services').set('Authorization', `Bearer ${token}`).send({ ...valid, name: 'After restart' });
    expect(next.status).toBe(201);
    expect(next.body.id).toBeGreaterThan(created.body.id);
  } finally { await stopBackend(server); }
});
