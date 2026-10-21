const jwt = require("jsonwebtoken");
const { register, login } = require("../services/authService");
const { users } = require("../mock/data");
const { JWT_SECRET } = require("../config");

beforeEach(() => {
  users.splice(2);
});

describe("register", () => {
  it("creates a user with the user role and no password hash in the result", async () => {
    const result = await register({
      email: "a@test.com",
      password: "password1",
    });
    expect(result.role).toBe("user");
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("stores a hash, not the plain password", async () => {
    await register({ email: "a@test.com", password: "password1" });
    const stored = users.find((u) => u.email === "a@test.com");
    expect(stored.passwordHash).not.toBe("password1");
  });

  it("rejects a missing email", async () => {
    await expect(register({ password: "password1" })).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("rejects an invalid email", async () => {
    await expect(
      register({ email: "not-an-email", password: "password1" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a short password", async () => {
    await expect(
      register({ email: "a@test.com", password: "short" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a password over 72 characters", async () => {
    await expect(
      register({ email: "a@test.com", password: "x".repeat(73) }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a duplicate email, ignoring case", async () => {
    await register({ email: "a@test.com", password: "password1" });
    await expect(
      register({ email: "A@TEST.com", password: "password1" }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("login", () => {
  it("returns a token carrying the id and role", async () => {
    await register({ email: "a@test.com", password: "password1" });
    const { token, user } = await login({
      email: "a@test.com",
      password: "password1",
    });
    const decoded = jwt.verify(token, JWT_SECRET);
    expect(decoded.id).toBe(user.id);
    expect(decoded.role).toBe("user");
  });

  it("lets the seeded admin log in", async () => {
    const { user } = await login({
      email: "admin@queuesmart.test",
      password: "Queue123!",
    });
    expect(user.role).toBe("admin");
  });

  it("rejects a wrong password with 401", async () => {
    await expect(
      login({ email: "admin@queuesmart.test", password: "wrong-pass" }),
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("rejects an unknown email with the same 401 message", async () => {
    await expect(
      login({ email: "nobody@test.com", password: "password1" }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Invalid email or password",
    });
  });

  it("rejects missing fields with 400", async () => {
    await expect(login({ email: "a@test.com" })).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
