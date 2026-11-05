const request = require('supertest');
const app = require('../app');
const db = require('../db/pool');
const queue = require('../services/queueService');
const { updateService } = require('../services/serviceService');
const { getNotifications } = require('../services/notificationService');

// A4: Queue and QueueEntry live in PostgreSQL. These tests cover the database rules
// (constraints, statuses, concurrency) and that data survives a dropped connection pool.
const statusOf = async (userId) => (await db.query(
  'SELECT status FROM "QueueEntry" WHERE "userId" = $1 ORDER BY "entryId" DESC LIMIT 1', [userId])).rows[0]?.status;

beforeEach(async () => {
  await queue.resetQueues();
  await updateService(1, { status: 'open', priority: 'medium' });
});

describe('QueueEntry status values', () => {
  test('join -> waiting, leave -> canceled, serve -> served', async () => {
    await queue.joinQueue(301, 1);
    expect(await statusOf(301)).toBe('waiting');
    await queue.leaveQueue(301, 1);
    expect(await statusOf(301)).toBe('canceled');
    await queue.joinQueue(302, 1);
    await queue.serveNext(1);
    expect(await statusOf(302)).toBe('served');
  });

  test('keeps finished entries as history rows and lets the user join again', async () => {
    await queue.joinQueue(303, 1);
    await queue.leaveQueue(303, 1);
    await queue.joinQueue(303, 1);
    const { rows } = await db.query('SELECT status FROM "QueueEntry" WHERE "userId" = 303 ORDER BY "entryId"');
    expect(rows.map((r) => r.status)).toEqual(['canceled', 'waiting']);
  });

  test('stores the priority at join time as a rank', async () => {
    await updateService(1, { priority: 'high' });
    await queue.joinQueue(304, 1);
    const { rows } = await db.query('SELECT "priorityRank" FROM "QueueEntry" WHERE "userId" = 304');
    expect(rows[0].priorityRank).toBe(3);
  });

  test('lastServed is not reported after a user cancels', async () => {
    await queue.joinQueue(305, 1);
    await queue.leaveQueue(305, 1);
    expect(await queue.getCurrentQueue(305)).toEqual({ currentQueue: null, lastServed: null });
  });
});

describe('database constraints', () => {
  const insert = (queueId, userId, rank, status) => db.query(
    `INSERT INTO "QueueEntry" ("queueId", "userId", "priorityRank", status, "endedAt")
     VALUES ($1, $2, $3, $4::varchar, CASE WHEN $4::varchar = 'waiting' THEN NULL ELSE now() END)`, [queueId, userId, rank, status]);

  let queueId;
  beforeEach(async () => {
    queueId = (await db.query('INSERT INTO "Queue" ("serviceId") VALUES (2) ON CONFLICT ("serviceId") DO UPDATE SET status = \'open\' RETURNING "queueId"')).rows[0].queueId;
  });

  test('rejects an unknown status', async () => {
    await expect(insert(queueId, 310, 2, 'paused')).rejects.toMatchObject({ code: '23514' });
  });

  test('rejects a priority rank outside 1-3', async () => {
    await expect(insert(queueId, 311, 4, 'waiting')).rejects.toMatchObject({ code: '23514' });
  });

  test('rejects a non-positive user id', async () => {
    await expect(insert(queueId, 0, 2, 'waiting')).rejects.toMatchObject({ code: '23514' });
  });

  test('rejects an entry for a queue that does not exist', async () => {
    await expect(insert(999999, 312, 2, 'waiting')).rejects.toMatchObject({ code: '23503' });
  });

  test('rejects a Queue for a service that does not exist', async () => {
    await expect(db.query('INSERT INTO "Queue" ("serviceId") VALUES (999)')).rejects.toMatchObject({ code: '23503' });
  });

  test('allows only one Queue row per service', async () => {
    await expect(db.query('INSERT INTO "Queue" ("serviceId") VALUES (2)')).rejects.toMatchObject({ code: '23505' });
  });

  test('allows only one waiting entry per user, but many finished ones', async () => {
    await insert(queueId, 313, 2, 'waiting');
    await expect(insert(queueId, 313, 2, 'waiting')).rejects.toMatchObject({ code: '23505' });
    await insert(queueId, 314, 2, 'served');
    await insert(queueId, 314, 2, 'canceled');
  });

  test('requires endedAt exactly when the entry is no longer waiting', async () => {
    await expect(db.query(`INSERT INTO "QueueEntry" ("queueId", "userId", "priorityRank", status)
      VALUES ($1, 315, 2, 'served')`, [queueId])).rejects.toMatchObject({ code: '23514' });
  });
});

describe('concurrency', () => {
  test('simultaneous joins by the same user create only one entry', async () => {
    const results = await Promise.allSettled([queue.joinQueue(320, 1), queue.joinQueue(320, 1), queue.joinQueue(320, 1)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    results.filter((r) => r.status === 'rejected').forEach((r) => expect(r.reason.statusCode).toBe(409));
    expect((await queue.getQueue(1)).length).toBe(1);
  });

  test('simultaneous joins by different users all succeed with distinct positions', async () => {
    const ids = [321, 322, 323, 324, 325];
    await Promise.all(ids.map((id) => queue.joinQueue(id, 1)));
    const view = await queue.getQueue(1);
    expect(view.queue.map((e) => e.position)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(view.queue.map((e) => e.userId))).toEqual(new Set(ids));
  });

  test('simultaneous serve-next calls never serve the same person twice', async () => {
    for (const id of [330, 331, 332]) await queue.joinQueue(id, 1);
    const results = await Promise.all([queue.serveNext(1), queue.serveNext(1), queue.serveNext(1)]);
    expect(new Set(results.map((r) => r.served.userId)).size).toBe(3);
    expect((await queue.getQueue(1)).length).toBe(0);
  });

  test('almost-ready is sent once per user even with simultaneous leaves', async () => {
    for (const id of [340, 341, 342, 343]) await queue.joinQueue(id, 1);
    await Promise.all([queue.leaveQueue(340, 1), queue.leaveQueue(341, 1)]);
    const almost = getNotifications(343).filter((n) => n.message.includes('almost up'));
    expect(almost).toHaveLength(1);
  });
});

describe('persistence', () => {
  test('queue data survives dropping and reopening the connection pool', async () => {
    await queue.joinQueue(350, 1);
    await queue.joinQueue(351, 1);
    await queue.serveNext(1);
    await db.close(); // same effect as stopping the backend: nothing is kept in memory
    const view = await queue.getQueue(1);
    expect(view.queue.map((e) => e.userId)).toEqual([351]);
    expect((await queue.getCurrentQueue(350)).lastServed).toMatchObject({ serviceId: 1 });
    expect((await queue.getCurrentQueue(351)).currentQueue).toMatchObject({ position: 1 });
  });

  test('queue length in the service list comes from the database', async () => {
    await queue.joinQueue(352, 1);
    await db.close();
    const res = await request(app).get('/api/services');
    expect(res.body.find((s) => s.id === 1).queueLength).toBe(1);
  });
});

describe('user id validation', () => {
  test.each([0, -3, 1.5, 'abc', '1e3', 2147483648, true])('rejects %p with 400', async (id) => {
    await expect(queue.joinQueue(id, 1)).rejects.toMatchObject({ statusCode: 400 });
  });

  test('accepts a numeric string id and treats it as the same user', async () => {
    await queue.joinQueue('360', 1);
    await expect(queue.joinQueue(360, 1)).rejects.toMatchObject({ statusCode: 409 });
  });
});
