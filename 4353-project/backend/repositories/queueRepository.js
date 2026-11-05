const db = require('../db/pool');

// Every query that touches "Queue" / "QueueEntry" lives here; queueService holds the rules.
// Waiting entries are ranked in SQL: higher priority first, then earlier arrival.
const ranked = `SELECT e."entryId", e."userId", e."queueId", q."serviceId", e."priorityRank", e."joinedAt",
    e."almostReadyNotified", ROW_NUMBER() OVER (PARTITION BY e."queueId"
      ORDER BY e."priorityRank" DESC, e."entryId") AS position,
    COUNT(*) OVER (PARTITION BY e."queueId") AS "queueLength"
  FROM "QueueEntry" e JOIN "Queue" q ON q."queueId" = e."queueId" WHERE e.status = 'waiting'`;

const asNumbers = (row) => row && { ...row, position: Number(row.position), queueLength: Number(row.queueLength) };

// Runs fn(client) inside one transaction (all-or-nothing).
async function transaction(fn) {
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

// One change at a time per service: positions and "almost ready" are decided from a stable queue.
async function lockService(client, serviceId) {
  await client.query('SELECT pg_advisory_xact_lock(4353003, $1)', [serviceId]);
}

async function ensureQueue(client, serviceId) {
  const result = await client.query(`INSERT INTO "Queue" ("serviceId") VALUES ($1)
    ON CONFLICT ("serviceId") DO UPDATE SET "serviceId" = EXCLUDED."serviceId" RETURNING "queueId"`, [serviceId]);
  return result.rows[0].queueId;
}

async function insertEntry(client, queueId, userId, priorityRank) {
  return (await client.query(`INSERT INTO "QueueEntry" ("queueId", "userId", "priorityRank")
    VALUES ($1, $2, $3) RETURNING "entryId", "joinedAt"`, [queueId, userId, priorityRank])).rows[0];
}

async function findWaitingByUser(client, userId) {
  return (await (client || db).query(`SELECT * FROM (${ranked}) r WHERE r."userId" = $1`, [userId])).rows.map(asNumbers)[0];
}

async function describeEntry(client, entryId) {
  return (await client.query(`SELECT * FROM (${ranked}) r WHERE r."entryId" = $1`, [entryId])).rows.map(asNumbers)[0];
}

async function listWaiting(serviceId) {
  return (await db.query(`SELECT * FROM (${ranked}) r WHERE r."serviceId" = $1 ORDER BY r.position`, [serviceId]))
    .rows.map(asNumbers);
}

async function cancelEntry(client, entryId) {
  await client.query(`UPDATE "QueueEntry" SET status = 'canceled', "endedAt" = now() WHERE "entryId" = $1`, [entryId]);
}

// Locks the first waiting entry so it can be served only once.
async function serveFirst(client, serviceId) {
  const next = (await client.query(`SELECT e."entryId", e."userId", e."priorityRank", e."joinedAt"
    FROM "QueueEntry" e JOIN "Queue" q ON q."queueId" = e."queueId"
    WHERE q."serviceId" = $1 AND e.status = 'waiting'
    ORDER BY e."priorityRank" DESC, e."entryId" LIMIT 1 FOR UPDATE OF e`, [serviceId])).rows[0];
  if (!next) return undefined;
  const { rows } = await client.query(`UPDATE "QueueEntry" SET status = 'served', "endedAt" = now()
    WHERE "entryId" = $1 RETURNING "endedAt"`, [next.entryId]);
  return { ...next, servedAt: rows[0].endedAt };
}

// Marks (once) every waiting entry now at or ahead of `maxPosition` and returns them.
async function claimAlmostReady(client, serviceId, maxPosition) {
  const { rows } = await client.query(`UPDATE "QueueEntry" SET "almostReadyNotified" = TRUE
    WHERE "entryId" IN (SELECT r."entryId" FROM (${ranked}) r
      WHERE r."serviceId" = $1 AND r.position <= $2 AND NOT r."almostReadyNotified")
    RETURNING "entryId", "userId"`, [serviceId, maxPosition]);
  const positions = await client.query(`SELECT "entryId", position FROM (${ranked}) r WHERE r."entryId" = ANY($1)`,
    [rows.map((row) => row.entryId)]);
  const byEntry = new Map(positions.rows.map((row) => [row.entryId, Number(row.position)]));
  return rows.map((row) => ({ userId: row.userId, position: byEntry.get(row.entryId) }))
    .sort((a, b) => a.position - b.position);
}

// Latest finished entry for a user (used for the "just served" message).
async function lastFinished(userId) {
  return (await db.query(`SELECT e.status, e."endedAt", q."serviceId" FROM "QueueEntry" e
    JOIN "Queue" q ON q."queueId" = e."queueId" WHERE e."userId" = $1 AND e.status <> 'waiting'
    ORDER BY e."entryId" DESC LIMIT 1`, [userId])).rows[0];
}

async function countWaiting() {
  const { rows } = await db.query(`SELECT q."serviceId", COUNT(*)::int AS count FROM "QueueEntry" e
    JOIN "Queue" q ON q."queueId" = e."queueId" WHERE e.status = 'waiting' GROUP BY q."serviceId"`);
  return new Map(rows.map((row) => [row.serviceId, row.count]));
}

async function countWaitingAtOrAbove(serviceId, rank) {
  const { rows } = await db.query(`SELECT COUNT(*)::int AS count FROM "QueueEntry" e
    JOIN "Queue" q ON q."queueId" = e."queueId"
    WHERE q."serviceId" = $1 AND e.status = 'waiting' AND e."priorityRank" >= $2`, [serviceId, rank]);
  return rows[0].count;
}

async function clearAll() {
  await db.query('TRUNCATE TABLE "QueueEntry"');
}

module.exports = {
  transaction, lockService, ensureQueue, insertEntry, findWaitingByUser, describeEntry, listWaiting, cancelEntry,
  serveFirst, claimAlmostReady, lastFinished, countWaiting, countWaitingAtOrAbove, clearAll,
};
