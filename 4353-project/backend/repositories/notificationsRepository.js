const db = require('../db/pool');

async function create(userId, message) {
    const result = await db.query(
        `INSERT INTO "Notification" ("userId", "message")
         VALUES ($1, $2)
         RETURNING *`,
        [userId, message]
    );

    return result.rows[0];
}

async function findByUserId(userId) {
    const result = await db.query(
        `SELECT * FROM "Notification"
         WHERE "userId" = $1
         ORDER BY "createdAt" DESC`,
        [userId]
    );

    return result.rows;
}

module.exports = {
    create,
    findByUserId
};