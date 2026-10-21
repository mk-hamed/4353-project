const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const { JWT_SECRET } = require("../config");

function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    next(new AppError("Invalid or expired token", 401));
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }
    if (req.user.role !== role) {
      return next(new AppError("You do not have permission to do this", 403));
    }
    next();
  };
}

const requireAdmin = requireRole("admin");

module.exports = { authenticate, requireRole, requireAdmin };
