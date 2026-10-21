const jwt = require("jsonwebtoken");
const { authenticate, requireRole } = require("../middleware/auth");
const { JWT_SECRET } = require("../config");

function run(middleware, req) {
  const next = jest.fn();
  middleware(req, {}, next);
  return next.mock.calls[0][0];
}

describe("authenticate", () => {
  it("rejects a missing header with 401", () => {
    const error = run(authenticate, { headers: {} });
    expect(error.statusCode).toBe(401);
  });

  it("rejects a wrong scheme with 401", () => {
    const error = run(authenticate, {
      headers: { authorization: "Basic abc" },
    });
    expect(error.statusCode).toBe(401);
  });

  it("rejects a garbage token with 401", () => {
    const error = run(authenticate, {
      headers: { authorization: "Bearer garbage" },
    });
    expect(error.statusCode).toBe(401);
  });

  it("rejects an expired token with 401", () => {
    const token = jwt.sign({ id: 1, role: "user" }, JWT_SECRET, {
      expiresIn: -10,
    });
    const error = run(authenticate, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(error.statusCode).toBe(401);
  });

  it("accepts a valid token and sets req.user", () => {
    const token = jwt.sign({ id: 7, role: "admin" }, JWT_SECRET, {
      expiresIn: "1h",
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const error = run(authenticate, req);
    expect(error).toBeUndefined();
    expect(req.user).toEqual({ id: 7, role: "admin" });
  });
});

describe("requireRole", () => {
  const adminOnly = requireRole("admin");

  it("rejects when nobody is logged in with 401", () => {
    expect(run(adminOnly, {}).statusCode).toBe(401);
  });

  it("rejects the wrong role with 403", () => {
    expect(run(adminOnly, { user: { role: "user" } }).statusCode).toBe(403);
  });

  it("allows the right role", () => {
    expect(run(adminOnly, { user: { role: "admin" } })).toBeUndefined();
  });
});
