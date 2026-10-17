const AppError = require('../utils/AppError');

// Member 1's authentication middleware must verify the token and populate
// req.user before this router. Never trust a role from a body or request header.
function requireServiceAdmin(req, res, next) {
  if (!req.user) return next(new AppError('Sign in as an administrator to manage services', 401));
  if (req.user.role !== 'admin') return next(new AppError('Administrator access is required', 403));
  next();
}

module.exports = requireServiceAdmin;
