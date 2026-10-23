const request = require("supertest");
const app = require("../app");
const { users } = require("../mock/data");

beforeEach(() => {
  users.splice(2);
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
    const stored = users.find((u) => u.email === "sneaky@test.com");
    expect(stored.role).toBe("user");
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
});
