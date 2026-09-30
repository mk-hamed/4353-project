import {
  normalizeEmail,
  validateLogin,
  validateRegistration,
} from "../utils/validation.js";

// A2 mock only. All accounts below live in memory and reset on a page refresh.
// Replace these functions with API calls in A3. Never ship this as real auth.
export const DEMO_PASSWORD = "Queue123!";
export const DEMO_ACCOUNTS = {
  user: {
    email: "user@queuesmart.test",
    password: DEMO_PASSWORD,
    role: "user",
  },
  admin: {
    email: "admin@queuesmart.test",
    password: DEMO_PASSWORD,
    role: "admin",
  },
};

const accounts = new Map(
  Object.values(DEMO_ACCOUNTS).map((account) => [
    account.email,
    { ...account },
  ]),
);

function publicUser(account) {
  // Never return a password to the rest of the app.
  return { email: account.email, role: account.role };
}

export async function login({ email, password }) {
  const errors = validateLogin({ email, password });
  if (Object.keys(errors).length)
    throw new Error("Check your email and password.");
  const account = accounts.get(normalizeEmail(email));
  if (!account || account.password !== password) {
    throw new Error(
      "Email or password is incorrect. Try again or use a demo account below.",
    );
  }
  return publicUser(account);
}

export async function register(values) {
  const errors = validateRegistration(values);
  if (Object.keys(errors).length)
    throw new Error("Please fix the highlighted fields.");
  const email = normalizeEmail(values.email);
  if (accounts.has(email)) {
    throw new Error(
      "An account with this email already exists. Sign in instead.",
    );
  }
  const account = { email, password: values.password, role: "user" };
  accounts.set(email, account);
  return publicUser(account);
}
