const express = require('express');
const request = require('supertest');
const app = require('../app');
const router = require('../routes/services');
const { errorHandler } = require('../middleware/errorHandler');
const { services } = require('../mock/data');
const { listServices, getServiceById, createService, updateService } = require('../services/serviceService');

const seed = services.map((service) => ({ ...service }));
const valid = { name: 'Advising', description: 'Academic planning', durationMin: 20, priority: 'medium' };
beforeEach(() => services.splice(0, services.length, ...seed.map((service) => ({ ...service }))));
afterAll(() => services.splice(0, services.length, ...seed));

function expectStatus(action, code) {
  expect(action).toThrow(expect.objectContaining({ statusCode: code }));
}

// This trusted identity exists only in the test harness, not in production.
function authenticatedApp(role) {
  const testApp = express();
  testApp.use(express.json());
  testApp.use((req, res, next) => { req.user = { id: 'test-user', role }; next(); });
  testApp.use('/api/services', router);
  testApp.use(errorHandler);
  return testApp;
}

describe('service logic', () => {
  test('creates a normalized service with server-owned fields and unique ids', () => {
    const created = createService({ ...valid, name: ' Advising ', description: ' Academic planning ' });
    expect(created).toEqual({ ...valid, id: 4, status: 'open', queueLength: 0 });
    expect(createService({ ...valid, name: 'Other' }).id).toBe(5);
    expect(listServices()).toContainEqual(created);
  });

  test('supports an empty catalog and explicit closed status', () => {
    services.splice(0);
    expect(createService({ ...valid, status: 'closed' })).toMatchObject({ id: 1, status: 'closed' });
  });

  test('returns copies so callers cannot accidentally change shared data', () => {
    const created = createService(valid);
    created.name = 'Changed';
    listServices()[0].name = 'Changed';
    getServiceById(1).name = 'Changed';
    expect(getServiceById(created.id).name).toBe('Advising');
    expect(getServiceById(1).name).toBe(seed[0].name);
  });

  test('updates all editable fields, retaining the id and queue length', () => {
    expect(updateService('1', { ...valid, status: 'closed' })).toEqual({ ...valid, status: 'closed', id: 1, queueLength: 4 });
  });

  test('allows a status-only update and an unchanged service name', () => {
    expect(updateService(1, { status: 'closed' })).toEqual({ ...seed[0], status: 'closed' });
    expect(updateService(1, { name: seed[0].name }).name).toBe(seed[0].name);
  });

  test('rejects duplicate names on create and edit without mutating data', () => {
    expectStatus(() => createService({ ...valid, name: ' student INQUIRIES ' }), 409);
    expectStatus(() => updateService(2, { name: 'Student Inquiries' }), 409);
    expect(services).toEqual(seed);
  });

  test('accepts maximum lengths and duration boundaries', () => {
    expect(createService({ ...valid, name: 'a'.repeat(100), description: 'b'.repeat(500), durationMin: 480 }).durationMin).toBe(480);
    expect(updateService(1, { durationMin: 1 }).durationMin).toBe(1);
  });

  test.each([
    ['name missing', { name: undefined }], ['name empty', { name: ' ' }],
    ['name type', { name: 5 }], ['name too long', { name: 'x'.repeat(101) }],
    ['description missing', { description: undefined }], ['description empty', { description: ' ' }],
    ['description type', { description: {} }], ['description too long', { description: 'x'.repeat(501) }],
    ['duration missing', { durationMin: undefined }], ['duration string', { durationMin: '10' }],
    ['duration null', { durationMin: null }], ['duration boolean', { durationMin: true }],
    ['duration zero', { durationMin: 0 }], ['duration negative', { durationMin: -1 }],
    ['duration too long', { durationMin: 481 }], ['duration fractional', { durationMin: 1.5 }],
    ['duration infinite', { durationMin: Infinity }], ['duration NaN', { durationMin: NaN }],
    ['priority missing', { priority: undefined }], ['priority invalid', { priority: 'urgent' }],
    ['priority type', { priority: 1 }], ['status invalid', { status: 'paused' }],
    ['server-owned id', { id: 100 }], ['server-owned count', { queueLength: 100 }],
  ])('rejects %s atomically on create and update', (label, patch) => {
    expectStatus(() => createService({ ...valid, ...patch }), 400);
    expectStatus(() => updateService(1, patch), 400);
    expect(services).toEqual(seed);
  });

  test.each([null, undefined, [], 'bad', 42, {}])('rejects invalid request data: %p', (input) => {
    expectStatus(() => createService(input), 400);
    expectStatus(() => updateService(1, input), 400);
  });

  test.each(['abc', '1x', '1.0', '0', '-1', '1.5', '9007199254740992'])('rejects invalid service id %s', (id) => {
    expectStatus(() => updateService(id, valid), 400);
  });

  test('unknown service produces 404 without adding a service', () => {
    expectStatus(() => updateService(999, valid), 404);
    expect(services).toEqual(seed);
  });
});

describe('service endpoints and authorization', () => {
  test('public listing works and create/update reject unauthenticated callers', async () => {
    expect((await request(app).get('/api/services')).body).toEqual(seed);
    for (const method of ['post', 'put']) {
      const url = method === 'post' ? '/api/services' : '/api/services/1';
      const response = await request(app)[method](url)
        .set('Authorization', 'Bearer fake').set('X-Role', 'admin').send({ ...valid, role: 'admin' });
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: expect.any(String) });
    }
    expect(services).toEqual(seed);
  });

  test('authenticated non-admin users cannot create or edit services', async () => {
    const userApp = authenticatedApp('user');
    expect((await request(userApp).post('/api/services').send(valid)).status).toBe(403);
    expect((await request(userApp).put('/api/services/1').send(valid)).status).toBe(403);
    expect(services).toEqual(seed);
  });

  test('admin can create, edit, close and list a service across requests', async () => {
    const adminApp = authenticatedApp('admin');
    const created = await request(adminApp).post('/api/services').send(valid);
    expect(created.status).toBe(201);
    const edited = await request(adminApp).put(`/api/services/${created.body.id}`).send({ durationMin: 25, status: 'closed' });
    expect(edited.status).toBe(200);
    expect(edited.body).toMatchObject({ name: valid.name, durationMin: 25, status: 'closed' });
    expect((await request(app).get('/api/services')).body).toContainEqual(edited.body);
  });

  test('returns useful JSON for validation, duplicate, missing id and malformed JSON', async () => {
    const adminApp = authenticatedApp('admin');
    for (const [path, body, status] of [
      ['/1', { durationMin: 'ten' }, 400],
      ['/2', { name: seed[0].name }, 409],
      ['/999', valid, 404],
    ]) {
      const response = await request(adminApp).put(`/api/services${path}`).send(body);
      expect(response.status).toBe(status);
      expect(response.body).toEqual({ error: expect.any(String) });
    }
    const malformed = await request(adminApp).post('/api/services').set('Content-Type', 'application/json').send('{broken');
    expect(malformed.status).toBe(400);
    expect(malformed.body).toEqual({ error: 'Invalid JSON in request body' });
  });
});
