const { randomBytes } = require('node:crypto');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('Set TEST_DATABASE_URL to a dedicated test database before running tests.');
}

// Each suite owns a fresh schema. No existing tables or application data are truncated.
const schema = `a4_test_${randomBytes(8).toString('hex')}`;
process.env.DB_SCHEMA = schema;
process.env.SEED_DEMO_QUEUES = 'true';
const db = require('../db/pool');
const { migrate } = require('../db/migrate');
const { seed } = require('../db/seed');
const { queueEntries } = require('../mock/data');
const initialQueue = queueEntries.map((entry) => ({ ...entry }));

beforeAll(async () => {
  await db.query(`CREATE SCHEMA "${schema}"`);
  await migrate();
});

beforeEach(async () => {
  await db.query('TRUNCATE TABLE "Service" RESTART IDENTITY');
  await seed();
  queueEntries.splice(0, queueEntries.length, ...initialQueue.map((entry) => ({ ...entry })));
});

afterAll(async () => {
  try {
    await db.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await db.close();
  }
});
