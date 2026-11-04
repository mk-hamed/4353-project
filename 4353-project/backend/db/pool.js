const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { Pool } = require('pg');

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.NODE_ENV === 'test'
      ? process.env.TEST_DATABASE_URL
      : process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(`${process.env.NODE_ENV === 'test' ? 'TEST_DATABASE_URL' : 'DATABASE_URL'} is required`);
    }
    const schema = process.env.DB_SCHEMA || 'public';
    if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error('Invalid DB_SCHEMA');
    pool = new Pool({
      connectionString,
      options: `-c search_path=${schema}`,
      max: Number(process.env.DB_POOL_MAX || 10),
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    });
    pool.on('error', (error) => console.error('Database connection error:', error.code || 'unknown'));
  }
  return pool;
}

function query(text, values) {
  return getPool().query(text, values);
}

async function close() {
  if (pool) {
    const current = pool;
    pool = undefined;
    await current.end();
  }
}

module.exports = { getPool, query, close };
