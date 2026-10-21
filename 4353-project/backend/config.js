module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || "dev-only-secret-change-me",
  TOKEN_EXPIRES_IN: "2h",
};
