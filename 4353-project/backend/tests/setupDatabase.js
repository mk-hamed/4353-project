const { randomBytes } = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('Set TEST_DATABASE_URL to a dedicated test database before running tests.');
}

// Each suite owns a fresh schema. No existing tables or application data are truncated.
const schema = `a4_test_${randomBytes(8).toString('hex')}`;
process.env.DB_SCHEMA = schema;
const db = require('../db/pool');
const { migrate } = require('../db/migrate');
const { seed } = require('../db/seed');

// Original A3 fixtures: 4 people waiting for service 1 and 7 for service 2 (user ids 9001+ are not real accounts).
async function seedDemoQueues() {
  let userId = 9000;
  for (const [serviceId, count, rank] of [[1, 4, 2], [2, 7, 3]]) {
    const { rows } = await db.query('INSERT INTO "Queue" ("serviceId") VALUES ($1) RETURNING "queueId"', [serviceId]);
    for (let i = 0; i < count; i += 1) {
      userId += 1;
      await db.query(`INSERT INTO "QueueEntry" ("queueId", "userId", "priorityRank", "almostReadyNotified")
        VALUES ($1, $2, $3, TRUE)`, [rows[0].queueId, userId, rank]);
    }
  }
}

beforeAll(async () => {
  await db.query(`CREATE SCHEMA "${schema}"`);
  await migrate();
});

beforeEach(async () => {
  await db.query('TRUNCATE TABLE "Service", "Queue", "QueueEntry" RESTART IDENTITY CASCADE');
  await seed();
  await seedDemoQueues();
});

afterAll(async () => {
  try {
    await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await db.close();
  }
});
