import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { listServices, createService, updateService } from '../src/services/serviceApi.js';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('lists backend services', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(url, '/api/services');
    return { ok: true, json: async () => [{ id: 1, name: 'From server' }] };
  };
  assert.deepEqual(await listServices(), [{ id: 1, name: 'From server' }]);
});

test('creates with JSON and forwards the authenticated token', async () => {
  const data = { name: 'Advising', durationMin: 20 };
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/services');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), data);
    assert.equal(options.headers.Authorization, 'Bearer verified-login-token');
    assert.equal(options.headers['Content-Type'], 'application/json');
    return { ok: true, json: async () => ({ id: 4, ...data }) };
  };
  assert.equal((await createService(data, 'verified-login-token')).id, 4);
});

test('updates via PUT without fabricating credentials', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/services/4');
    assert.equal(options.method, 'PUT');
    assert.equal(options.headers.Authorization, undefined);
    return { ok: true, json: async () => ({ id: 4, status: 'closed' }) };
  };
  assert.equal((await updateService(4, { status: 'closed' })).status, 'closed');
});

test('propagates backend errors rather than reporting a successful save', async () => {
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: 'Administrator access is required' }) });
  await assert.rejects(createService({}), /Administrator access is required/);
});

test('reports network failure', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(listServices(), /Cannot reach the server/);
});

test('reports non-JSON server responses', async () => {
  globalThis.fetch = async () => ({ ok: false, json: async () => { throw new SyntaxError(); } });
  await assert.rejects(listServices(), /unreadable response/);
});
