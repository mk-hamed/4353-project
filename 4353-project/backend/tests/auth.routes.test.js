const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const db = require("../db/pool");
const { seedUsers } = require("../db/seedUsers");
const { JWT_SECRET } = require("../config");

beforeAll(async () => {
  await seedUsers();
});

beforeEach(async () => {
  await db.query('DELETE FROM "UserCredentials" WHERE "userId" > 2');
});

describe("POST /api/auth/register", () => {
  it("creates a user and returns 201 without a password hash", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@test.com", password: "password1" });
    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe("user");
    expect(res.body).not.toHaveProperty("passwordHash");
  });

  it("returns 400 for invalid input", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "bad", password: "password1" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 409 for a duplicate email", async () => {
    const body = { email: "a@test.com", password: "password1" };
    await request(app).post("/api/auth/register").send(body);
    const res = await request(app).post("/api/auth/register").send(body);
    expect(res.statusCode).toBe(409);
  });

  it("ignores a role sent by the client", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "sneaky@test.com", password: "password1", role: "admin" });
    expect(res.statusCode).toBe(201);
    expect(res.body.role).toBe("user");
    const { rows } = await db.query(
      'SELECT role FROM "UserCredentials" WHERE email = $1',
      ["sneaky@test.com"],
    );
    expect(rows[0].role).toBe("user");
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token and user for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@queuesmart.test", password: "Queue123!" });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.role).toBe("admin");
  });

  it("returns 401 for a wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@queuesmart.test", password: "wrong-pass" });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  it("returns the current user with a valid token", async () => {
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@queuesmart.test", password: "Queue123!" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe("admin@queuesmart.test");
  });

  it("returns 401 when the token is valid but the user no longer exists", async () => {
    const token = jwt.sign({ id: 9999, role: "user" }, JWT_SECRET);
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it("lets a newly registered user log in and fetch their own profile", async () => {
    await request(app)
      .post("/api/auth/register")
      .send({ email: "flow@test.com", password: "password1" });
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "flow@test.com", password: "password1" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe("flow@test.com");
    expect(res.body.role).toBe("user");
  });
});
