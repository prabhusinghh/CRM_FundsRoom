const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

// Verifies the Bearer token and attaches the decoded payload to req.user.
// Payload shape: { id, name, email, role }
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing or invalid Authorization header'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};

module.exports = authenticate;
