const request = require('supertest');
const app = require('../app');

describe('error handling', () => {
    it('returns a 404 JSON error for unknown routes', async () => {
        const res = await request(app).get('/api/does-not-exist');

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error');
    });

    it('returns a 400 JSON error for malformed JSON bodies', async () => {
        const res = await request(app)
            .post('/api/anything')
            .set('Content-Type', 'application/json')
            .send('{bad json');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('Invalid JSON in request body');
    });
});