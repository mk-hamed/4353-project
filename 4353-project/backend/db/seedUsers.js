const bcrypt = require('bcrypt');
const db = require('./pool');

const DEMO_PASSWORD = 'Queue123!';
const DEMO_USERS = [
  { userId: 1, email: 'admin@queuesmart.test', role: 'admin' },
  { userId: 2, email: 'user@queuesmart.test', role: 'user' },
];

async function seedUsers() {
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    for (const user of DEMO_USERS) {
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
      await client.query(
        `INSERT INTO "UserCredentials" ("userId", email, "passwordHash", role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [user.userId, user.email, passwordHash, user.role]
      );
    }
    await client.query(
      `SELECT setval(pg_get_serial_sequence('"UserCredentials"', 'userId'),
                     (SELECT MAX("userId") FROM "UserCredentials"))`
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedUsers()
    .then(() => console.log('Demo accounts ready'))
    .catch((error) => { console.error('Seed failed:', error.message); process.exitCode = 1; })
    .finally(() => db.close());
}

module.exports = { seedUsers, DEMO_USERS, DEMO_PASSWORD };