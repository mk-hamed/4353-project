import test from "node:test";
import assert from "node:assert/strict";
import {
  validateLogin,
  validateRegistration,
} from "../src/utils/validation.js";
import { DEMO_ACCOUNTS, login, register } from "../src/services/authService.js";

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
  assert.deepEqual(registration("a".repeat(128)), {});
  assert.ok(registration("a".repeat(129)).password);
  assert.ok(registration("        ").password);
  assert.ok(registration("Queue123!", "").confirmPassword);
  assert.ok(registration("Queue123!", "different").confirmPassword);
});

test("demo login returns only the email and the correct role", async () => {
  for (const account of Object.values(DEMO_ACCOUNTS)) {
    assert.deepEqual(await login(account), {
      email: account.email,
      role: account.role,
    });
  }
});

test("unknown accounts and incorrect passwords fail", async () => {
  await assert.rejects(
    login({ email: "missing@example.com", password: "Queue123!" }),
    /incorrect/,
  );
  await assert.rejects(
    login({ ...DEMO_ACCOUNTS.user, password: "wrong" }),
    /incorrect/,
  );
});

test("new registrations can log in, always as a regular user", async () => {
  const account = await register({
    email: " NEW@example.com ",
    password: "DemoPass123!",
    confirmPassword: "DemoPass123!",
    role: "admin",
  });
  assert.deepEqual(account, { email: "new@example.com", role: "user" });
  assert.deepEqual(
    await login({ email: "New@Example.com", password: "DemoPass123!" }),
    account,
  );
});

test("duplicate registrations reject emails regardless of case or surrounding spaces", async () => {
  await assert.rejects(
    register({
      email: " USER@QUEUESMART.TEST ",
      password: "Queue123!",
      confirmPassword: "Queue123!",
    }),
    /already exists/,
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
    /incorrect/,
  );
});

test("password characters, including surrounding spaces, are preserved", async () => {
  await register({
    email: "spaces@example.com",
    password: " padded password ",
    confirmPassword: " padded password ",
  });
  assert.equal(
    (
      await login({
        email: "spaces@example.com",
        password: " padded password ",
      })
    ).role,
    "user",
  );
  await assert.rejects(
    login({ email: "spaces@example.com", password: "padded password" }),
    /incorrect/,
  );
});
