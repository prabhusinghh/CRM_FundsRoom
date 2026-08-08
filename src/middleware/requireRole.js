const { ApiError } = require('./errorHandler');

// Usage: router.post('/', authenticate, requireRole('Admin', 'Sales'), controllerFn)
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authenticated'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(
      new ApiError(403, `Role '${req.user.role}' is not permitted to perform this action`)
    );
  }
  next();
};

module.exports = requireRole;
