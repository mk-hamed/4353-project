const request = require('supertest');
const app = require('../app');

describe('GET /api/services', () => {
  it('returns a list of services', async () => {
    const res = await request(app).get('/api/services');

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});