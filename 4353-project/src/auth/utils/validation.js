// These are front-end demo rules, not a replacement for server validation.
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function validateEmail(email) {
  const value = normalizeEmail(email);
  if (!value) return "Enter your email address.";
  if (value.length > 254)
    return "Use an email address with 254 characters or fewer.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Enter a valid email, like name@example.com.";
  }
  return "";
}

export function validateLogin({ email, password }) {
  const errors = {};
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;
  if (!password.trim()) errors.password = "Enter your password.";
  return errors;
}

export function validateRegistration({ email, password, confirmPassword }) {
  const errors = validateLogin({ email, password });
  if (!errors.password && password.length < MIN_PASSWORD_LENGTH) {
    errors.password = "Use at least 8 characters for your password.";
  } else if (!errors.password && password.length > MAX_PASSWORD_LENGTH) {
    errors.password = "Use 128 characters or fewer for your password.";
  }
  if (!confirmPassword) {
    errors.confirmPassword = "Enter your password again.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Your passwords do not match.";
  }
  return errors;
}
