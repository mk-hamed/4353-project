const request = require('supertest');
const app = require('../app');
const { services } = require('../mock/data');
const { resetQueues } = require('../services/queueService');

async function login(email, password = 'Queue123!') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return { token: res.body.token, id: res.body.user.id };
}
const auth = (who) => ({ Authorization: `Bearer ${who.token}` });

let admin;
let user;
let second;
let third;

beforeAll(async () => {
  admin = await login('admin@queuesmart.test');
  user = await login('user@queuesmart.test');
  await request(app).post('/api/auth/register').send({ email: 'second@queuesmart.test', password: 'Queue123!' });
  second = await login('second@queuesmart.test');
  await request(app).post('/api/auth/register').send({ email: 'third@queuesmart.test', password: 'Queue123!' });
  third = await login('third@queuesmart.test');
});

beforeEach(() => {
  resetQueues();
  services.find((s) => s.id === 3).status = 'closed';
});

describe('authentication and roles', () => {
  test.each([
    ['get', '/api/queues'],
    ['get', '/api/queues/current'],
    ['get', '/api/queues/1'],
    ['post', '/api/queues/1/join'],
    ['post', '/api/queues/1/leave'],
    ['post', '/api/queues/1/serve-next'],
  ])('%s %s returns 401 without a token', async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });

  test('rejects an invalid token', async () => {
    const res = await request(app).get('/api/queues').set('Authorization', 'Bearer not-a-token');
    expect(res.statusCode).toBe(401);
  });

  test('a normal user cannot call admin endpoints (403)', async () => {
    expect((await request(app).get('/api/queues/1').set(auth(user))).statusCode).toBe(403);
    expect((await request(app).post('/api/queues/1/serve-next').set(auth(user))).statusCode).toBe(403);
  });

  test('an admin cannot join or leave a queue (403)', async () => {
    expect((await request(app).post('/api/queues/1/join').set(auth(admin))).statusCode).toBe(403);
    expect((await request(app).post('/api/queues/1/leave').set(auth(admin))).statusCode).toBe(403);
    expect((await request(app).get('/api/queues/current').set(auth(admin))).statusCode).toBe(403);
  });
});

describe('join, status and leave', () => {
  test('join returns 201 with position and estimated wait', async () => {
    const res = await request(app).post('/api/queues/1/join').set(auth(user));
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({ serviceId: 1, position: 1, estimatedWaitMin: 10, status: 'almost-ready' });
  });

  test('GET /current shows the logged-in user\'s queue', async () => {
    await request(app).post('/api/queues/1/join').set(auth(user));
    const res = await request(app).get('/api/queues/current').set(auth(user));
    expect(res.statusCode).toBe(200);
    expect(res.body.currentQueue).toMatchObject({ serviceId: 1, serviceName: 'Student Inquiries', position: 1 });
  });

  test('GET /current is empty when not in a queue', async () => {
    const res = await request(app).get('/api/queues/current').set(auth(user));
    expect(res.body).toEqual({ currentQueue: null, lastServed: null });
  });

  test('joining twice returns 409', async () => {
    await request(app).post('/api/queues/1/join').set(auth(user));
    const res = await request(app).post('/api/queues/1/join').set(auth(user));
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/already/);
  });

  test('joining a closed queue returns 409', async () => {
    const res = await request(app).post('/api/queues/3/join').set(auth(user));
    expect(res.statusCode).toBe(409);
  });

  test('bad and unknown service ids return 400 and 404 as { error }', async () => {
    const bad = await request(app).post('/api/queues/abc/join').set(auth(user));
    expect(bad.statusCode).toBe(400);
    expect(bad.body).toEqual({ error: expect.any(String) });
    expect((await request(app).post('/api/queues/999/join').set(auth(user))).statusCode).toBe(404);
  });

  test('leave removes the user, and leaving again returns 404', async () => {
    await request(app).post('/api/queues/1/join').set(auth(user));
    const left = await request(app).post('/api/queues/1/leave').set(auth(user));
    expect(left.statusCode).toBe(200);
    expect(left.body).toMatchObject({ left: true, serviceId: 1 });
    expect((await request(app).post('/api/queues/1/leave').set(auth(user))).statusCode).toBe(404);
  });

  test('GET /api/queues lists each service with queue length and new-joiner wait', async () => {
    await request(app).post('/api/queues/1/join').set(auth(user));
    const res = await request(app).get('/api/queues').set(auth(user));
    expect(res.statusCode).toBe(200);
    expect(res.body.find((s) => s.serviceId === 1)).toEqual({ serviceId: 1, queueLength: 1, estimatedWaitMin: 20 });
  });
});

describe('admin view and serve next', () => {
  test('admin sees the queue in order', async () => {
    await request(app).post('/api/queues/1/join').set(auth(user));
    await request(app).post('/api/queues/1/join').set(auth(second));
    const res = await request(app).get('/api/queues/1').set(auth(admin));
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body.queue.map((e) => e.email)).toEqual(['user@queuesmart.test', 'second@queuesmart.test']);
  });

  test('serve-next serves the first user, advances the second, and updates GET /api/services', async () => {
    await request(app).post('/api/queues/1/join').set(auth(user));
    await request(app).post('/api/queues/1/join').set(auth(second));

    const served = await request(app).post('/api/queues/1/serve-next').set(auth(admin));
    expect(served.statusCode).toBe(200);
    expect(served.body.served.email).toBe('user@queuesmart.test');
    expect(served.body.queueLength).toBe(1);

    const first = await request(app).get('/api/queues/current').set(auth(user));
    expect(first.body.currentQueue).toBeNull();
    expect(first.body.lastServed.serviceName).toBe('Student Inquiries');
    const next = await request(app).get('/api/queues/current').set(auth(second));
    expect(next.body.currentQueue.position).toBe(1);

    const list = await request(app).get('/api/services');
    expect(list.body.find((s) => s.id === 1).queueLength).toBe(1);
  });

  test('serve-next on an empty queue returns 409', async () => {
    const res = await request(app).post('/api/queues/2/serve-next').set(auth(admin));
    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: 'No one is waiting in this queue' });
  });

  test('unknown service returns 404 for admin endpoints', async () => {
    expect((await request(app).get('/api/queues/999').set(auth(admin))).statusCode).toBe(404);
    expect((await request(app).post('/api/queues/999/serve-next').set(auth(admin))).statusCode).toBe(404);
  });
});

describe('integration with notifications and history', () => {
  test('join, serve and leave create history records and notifications for that user', async () => {
    await request(app).post('/api/queues/1/join').set(auth(third));
    await request(app).post('/api/queues/1/serve-next').set(auth(admin));
    await request(app).post('/api/queues/2/join').set(auth(third));
    await request(app).post('/api/queues/2/leave').set(auth(third));

    const history = await request(app).get(`/api/history/${third.id}`);
    expect(history.body.map((h) => h.record.action)).toEqual(['joined_queue', 'served', 'joined_queue', 'left_queue']);
    expect(history.body.map((h) => h.record.outcome)).toEqual(['Joined', 'Served', 'Joined', 'Left queue']);

    const notes = await request(app).get(`/api/notifications/${third.id}`);
    expect(notes.body.some((n) => /You joined Student Inquiries/.test(n.message))).toBe(true);
    expect(notes.body.some((n) => /almost up/.test(n.message))).toBe(true);
    expect(notes.body.some((n) => /been served/.test(n.message))).toBe(true);
  });
});
