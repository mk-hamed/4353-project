const jwt = require("jsonwebtoken");
const { register, login, getUserById } = require("../services/authService");
const db = require("../db/pool");
const { seedUsers } = require("../db/seedUsers");
const { JWT_SECRET } = require("../config");
const { getEmailsByIds } = require("../services/authService");

beforeAll(async () => {
  await seedUsers();
});

beforeEach(async () => {
  await db.query('DELETE FROM "UserCredentials" WHERE "userId" > 2');
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
    const { rows } = await db.query(
      'SELECT "passwordHash" FROM "UserCredentials" WHERE email = $1',
      ["a@test.com"],
    );
    expect(rows[0].passwordHash).not.toBe("password1");
    expect(rows[0].passwordHash).toMatch(/^\$2[aby]\$/);
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

  it("rejects a whitespace-only password", async () => {
    await expect(
      register({ email: "a@test.com", password: "        " }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("accepts a password that contains spaces but is not only spaces", async () => {
    const result = await register({
      email: "a@test.com",
      password: " padded password ",
    });
    expect(result.role).toBe("user");
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

describe("database behavior", () => {
  it("lets only one of two simultaneous registrations with the same email succeed", async () => {
    const attempt = () =>
      register({ email: "race@test.com", password: "password1" });
    const results = await Promise.allSettled([attempt(), attempt()]);
    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected[0].reason.statusCode).toBe(409);
  });

  it("rejects an upper-case email inserted directly (database constraint)", async () => {
    await expect(
      db.query(
        `INSERT INTO "UserCredentials" (email, "passwordHash", role)
         VALUES ('Bad@Test.com', 'x', 'user')`,
      ),
    ).rejects.toThrow();
  });

  it("rejects an invalid role inserted directly (database constraint)", async () => {
    await expect(
      db.query(
        `INSERT INTO "UserCredentials" (email, "passwordHash", role)
         VALUES ('r@test.com', 'x', 'superuser')`,
      ),
    ).rejects.toThrow();
  });
});

describe("getUserById", () => {
  it("returns the public user for an existing id", async () => {
    const user = await getUserById(1);
    expect(user).toEqual({
      id: 1,
      email: "admin@queuesmart.test",
      role: "admin",
    });
  });

  it("throws 401 for an id that does not exist", async () => {
    await expect(getUserById(9999)).rejects.toMatchObject({ statusCode: 401 });
  });

  it("throws 401 for a non-integer id", async () => {
    await expect(getUserById("abc")).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("getEmailsByIds", () => {
  it("maps ids to emails and ignores unknown or invalid ids", async () => {
    const emails = await getEmailsByIds([1, 2, 9999, "abc"]);
    expect(emails.get(1)).toBe("admin@queuesmart.test");
    expect(emails.get(2)).toBe("user@queuesmart.test");
    expect(emails.has(9999)).toBe(false);
  });

  it("returns an empty map for an empty list", async () => {
    expect((await getEmailsByIds([])).size).toBe(0);
  });
});
