const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

// Run after a chain of express-validator checks. Turns any collected
// errors into a single 400 ApiError with a field-level breakdown.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    return next(new ApiError(400, 'Validation failed', details));
  }
  next();
};

module.exports = validate;
