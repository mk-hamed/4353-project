const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const { users } = require("../mock/data");
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
  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters", 400);
  }
  if (password.length > 72) {
    throw new AppError("Password must be at most 72 characters", 400);
  }
}

function toPublicUser(user) {
  return { id: user.id, email: user.email, role: user.role };
}

function nextUserId() {
  return Math.max(0, ...users.map((u) => u.id)) + 1;
}

async function register(input) {
  validateRegistration(input);
  const email = input.email.trim().toLowerCase();

  if (users.some((u) => u.email === email)) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = { id: nextUserId(), email, passwordHash, role: "user" };
  users.push(user);
  return toPublicUser(user);
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

  const user = users.find((u) => u.email === email.trim().toLowerCase());
  const passwordOk =
    user && (await bcrypt.compare(password, user.passwordHash));
  if (!passwordOk) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN,
  });
  return { token, user: toPublicUser(user) };
}

module.exports = { register, login, validateRegistration };
