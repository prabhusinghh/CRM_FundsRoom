class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

// 404 catch-all — must be mounted after all real routes.
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

// Final error handler — must be mounted last, with 4 args so Express
// recognizes it as an error middleware.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    message: err.message || 'Internal server error',
  };
  if (err.details) response.errors = err.details;

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json(response);
};

module.exports = { ApiError, notFound, errorHandler };
