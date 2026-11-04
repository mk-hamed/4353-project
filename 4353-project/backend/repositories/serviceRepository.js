const db = require('../db/pool');

const columns = '"serviceId" AS id, name, description, "expectedDuration" AS "durationMin", "priorityLevel" AS priority, status';
const fields = { name: 'name', description: 'description', durationMin: '"expectedDuration"', priority: '"priorityLevel"', status: 'status' };

async function list() {
  return (await db.query(`SELECT ${columns} FROM "Service" ORDER BY "serviceId"`)).rows;
}

async function find(id) {
  return (await db.query(`SELECT ${columns} FROM "Service" WHERE "serviceId" = $1`, [id])).rows[0];
}

async function create(data) {
  const result = await db.query(`INSERT INTO "Service" (name, description, "expectedDuration", "priorityLevel", status)
    VALUES ($1, $2, $3, $4, $5) RETURNING ${columns}`,
  [data.name, data.description, data.durationMin, data.priority, data.status || 'open']);
  return result.rows[0];
}

async function update(id, data) {
  const keys = Object.keys(data);
  if (!keys.length || keys.some((key) => !Object.hasOwn(fields, key))) throw new Error('Unsupported service update');
  const assignments = keys.map((key, index) => `${fields[key]} = $${index + 1}`).join(', ');
  return (await db.query(`UPDATE "Service" SET ${assignments} WHERE "serviceId" = $${keys.length + 1} RETURNING ${columns}`,
    [...keys.map((key) => data[key]), id])).rows[0];
}

module.exports = { list, find, create, update };
