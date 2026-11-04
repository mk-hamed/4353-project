const db = require('./pool');

async function seed() {
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE "Service" IN EXCLUSIVE MODE');
    const existing = await client.query('SELECT 1 FROM "Service" LIMIT 1');
    if (!existing.rowCount) {
      await client.query(`INSERT INTO "Service"
        ("serviceId", name, description, "expectedDuration", "priorityLevel", status) VALUES
        (1, 'Student Inquiries', 'General help desk', 10, 'medium', 'open'),
        (2, 'Enrollment Support', 'Course changes and enrollment', 15, 'high', 'open'),
        (3, 'IT Helpdesk', 'Password resets, Wi-Fi', 8, 'low', 'closed')`);
      await client.query(`SELECT setval(pg_get_serial_sequence('"Service"', 'serviceId'), 3)`);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seed().then(() => console.log('Demo services ready (existing catalog preserved)'))
    .catch((error) => { console.error('Seed failed:', error.message); process.exitCode = 1; })
    .finally(() => db.close());
}

module.exports = { seed };
