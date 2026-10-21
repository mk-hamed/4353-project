import {
  normalizeEmail,
  validateLogin,
  validateRegistration,
} from "../utils/validation.js";
import { apiRequest, setToken, clearToken } from "../../api/client.js";

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

export async function login({ email, password }) {
  const errors = validateLogin({ email, password });
  if (Object.keys(errors).length)
    throw new Error("Check your email and password.");

  const { token, user } = await apiRequest("/api/auth/login", {
    method: "POST",
    body: { email: normalizeEmail(email), password },
  });
  setToken(token);
  return user; // { id, email, role }, which is what Login.jsx already expects
}

export async function register(values) {
  const errors = validateRegistration(values);
  if (Object.keys(errors).length)
    throw new Error("Please fix the highlighted fields.");

  // Send only what the backend needs; confirmPassword stays in the browser.
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: { email: normalizeEmail(values.email), password: values.password },
  });
}

export async function getCurrentUser() {
  try {
    return await apiRequest("/api/auth/me");
  } catch (error) {
    if (error.status === 401) clearToken();
    return null;
  }
}

export function logout() {
  clearToken();
}
