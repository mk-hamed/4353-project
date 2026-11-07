const db = require('../db/pool');

async function create(userId, record) {
    const result = await db.query(
        `INSERT INTO "History" ("userId", "record")
         VALUES ($1, $2)
         RETURNING *`,
        [userId, JSON.stringify(record)]
    );
    return result.rows[0];
}

async function findByUserId(userId) {
    const result = await db.query(
        `SELECT * FROM "History"
         WHERE "userId" = $1
         ORDER BY "createdAt" ASC`,
        [userId]
    );
    return result.rows;
}

module.exports = { create, findByUserId };