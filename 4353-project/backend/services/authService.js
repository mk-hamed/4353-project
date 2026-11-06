const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const db = require("../db/pool");
const { JWT_SECRET, TOKEN_EXPIRES_IN } = require("../config");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration({ email, password } = {}) {
  if (typeof email !== "string" || email.trim() === "") {
    throw new AppError("Email is required", 400);
  }
  if (email.trim().length > 254) {
    throw new AppError("Email must be at most 254 characters", 400);
  }
  if (!EMAIL_PATTERN.test(email.trim())) {
    throw new AppError("Email is not valid", 400);
  }
  if (typeof password !== "string" || password === "") {
    throw new AppError("Password is required", 400);
  }
  if (typeof password !== "string" || password === "") {
    throw new AppError("Password is required", 400);
  }
  if (password.trim() === "") {
    throw new AppError("Password cannot be only spaces", 400);
  }
  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
  if (password.length > 72) {
    throw new AppError("Password must be at most 72 characters", 400);
  }
}

function toPublicUser(row) {
  return { id: row.userId, email: row.email, role: row.role };
}

async function register(input) {
  validateRegistration(input);
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const result = await db.query(
      `INSERT INTO "UserCredentials" (email, "passwordHash", role)
       VALUES ($1, $2, 'user')
       RETURNING "userId", email, role`,
      [email, passwordHash]
    );
    return toPublicUser(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      throw new AppError("Email is already registered", 409);
    }
    throw error;
  }
}

async function login({ email, password } = {}) {
  if (
    typeof email !== "string" ||
    email.trim() === "" ||
    typeof password !== "string" ||
    password === ""
  ) {
    throw new AppError("Email and Password are required", 400);
  }

  const result = await db.query(
    `SELECT "userId", email, "passwordHash", role
     FROM "UserCredentials" WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
  const user = result.rows[0];
  const passwordOk =
    user && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordOk) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign({ id: user.userId, role: user.role }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
  return { token, user: toPublicUser(user) };
}

async function getUserById(id) {
  if (!Number.isInteger(id)) {
    throw new AppError("User no longer exists", 401);
  }
  const result = await db.query(
    `SELECT "userId", email, role FROM "UserCredentials" WHERE "userId" = $1`,
    [id]
  );
  if (!result.rows[0]) {
    throw new AppError("User no longer exists", 401);
  }
  return toPublicUser(result.rows[0]);
}

async function getEmailsByIds(userIds) {
  const ids = [...new Set(userIds.map(Number))].filter(Number.isInteger);
  if (ids.length === 0) return new Map();
  const result = await db.query(
    `SELECT "userId", email FROM "UserCredentials" WHERE "userId" = ANY($1::int[])`,
    [ids]
  );
  return new Map(result.rows.map((row) => [row.userId, row.email]));
}

module.exports = { register, login, validateRegistration, getUserById, getEmailsByIds };
