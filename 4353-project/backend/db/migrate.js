const fs = require('node:fs/promises');
const path = require('node:path');
const db = require('./pool');

async function migrate() {
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    // Serialize schema setup when multiple teammates start the migration together.
    await client.query('SELECT pg_advisory_xact_lock(4353004)');
    const directory = path.join(__dirname, 'migrations');
    const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
    for (const file of files) {
      const applied = await client.query('SELECT name FROM schema_migrations WHERE name = $1', [file]);
      if (applied.rowCount) continue;
      await client.query(await fs.readFile(path.join(directory, file), 'utf8'));
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
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
  migrate().then(() => console.log('Database migrations complete'))
    .catch((error) => { console.error('Migration failed:', error.message); process.exitCode = 1; })
    .finally(() => db.close());
}

module.exports = { migrate };
