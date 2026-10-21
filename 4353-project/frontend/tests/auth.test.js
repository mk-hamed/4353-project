import test from "node:test";
import assert from "node:assert/strict";
import {
  validateLogin,
  validateRegistration,
} from "../src/auth/utils/validation.js";
import {
  DEMO_ACCOUNTS,
  login,
  register,
} from "../src/auth/services/authService.js";

// Global storage mock
globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

test("blank login fields and malformed emails are rejected", () => {
  assert.deepEqual(Object.keys(validateLogin({ email: "", password: "" })), [
    "email",
    "password",
  ]);
  for (const email of [
    "plain",
    "a@",
    "@example.com",
    "a b@example.com",
    "a@@example.com",
  ]) {
    assert.ok(validateLogin({ email, password: "Queue123!" }).email);
  }
  assert.deepEqual(
    validateLogin({ email: " user@example.com ", password: "Queue123!" }),
    {},
  );
});

test("registration checks password boundaries, whitespace, and confirmation", () => {
  const registration = (password, confirmPassword = password) =>
    validateRegistration({
      email: "name@example.com",
      password,
      confirmPassword,
    });
  assert.ok(registration("1234567").password);
  assert.deepEqual(registration("12345678"), {});
  assert.deepEqual(registration("a".repeat(72)), {});
  assert.ok(registration("a".repeat(73)).password);
  assert.ok(registration("        ").password);
  assert.ok(registration("Queue123!", "").confirmPassword);
  assert.ok(registration("Queue123!", "different").confirmPassword);
});

test("demo login returns only the email and the correct role", async () => {
  for (const account of Object.values(DEMO_ACCOUNTS)) {
    const result = await login(account);
    assert.strictEqual(typeof result.id, "number");
    assert.deepEqual(
      { email: result.email, role: result.role },
      { email: account.email, role: account.role },
    );
  }
});

test("unknown accounts and incorrect passwords fail", async () => {
  await assert.rejects(
    login({ email: "missing@example.com", password: "Queue123!" }),
    /Invalid email or password/,
  );
  await assert.rejects(
    login({ ...DEMO_ACCOUNTS.user, password: "wrong" }),
    /Invalid email or password/,
  );
});

test("new registrations can log in, always as a regular user", async () => {
  const uniqueEmail = `new_${Date.now()}@example.com`;

  const account = await register({
    email: `  ${uniqueEmail.toUpperCase()} `,
    password: "DemoPass123!",
    confirmPassword: "DemoPass123!",
    role: "admin",
  });

  assert.strictEqual(account.email, uniqueEmail);
  assert.strictEqual(account.role, "user");
  assert.strictEqual(typeof account.id, "number");

  const loggedInAccount = await login({
    email: uniqueEmail,
    password: "DemoPass123!",
  });

  assert.deepEqual(loggedInAccount, account);
});

test("duplicate registrations reject emails regardless of case or surrounding spaces", async () => {
  await assert.rejects(
    register({
      email: " USER@QUEUESMART.TEST ",
      password: "Queue123!",
      confirmPassword: "Queue123!",
    }),
    /Email is already registered/,
  );
});

test("invalid registration does not create an account", async () => {
  await assert.rejects(
    register({
      email: "invalid@example.com",
      password: "short",
      confirmPassword: "short",
    }),
  );
  await assert.rejects(
    login({ email: "invalid@example.com", password: "short" }),
    /Invalid email or password/,
  );
});

test("password characters, including surrounding spaces, are preserved", async () => {
  const uniqueEmail = `spaces_${Date.now()}@example.com`;

  await register({
    email: uniqueEmail,
    password: " padded password ",
    confirmPassword: " padded password ",
  });

  assert.equal(
    (
      await login({
        email: uniqueEmail,
        password: " padded password ",
      })
    ).role,
    "user"
  );

  await assert.rejects(
    login({ email: uniqueEmail, password: "padded password" }),
    /Invalid email or password/ 
  );
});
