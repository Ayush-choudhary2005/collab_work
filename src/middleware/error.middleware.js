module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', err);
  }

  // Known operational errors (AppError) -> safe to expose message
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }

  // Mongoose duplicate key (e.g. duplicate slug, duplicate membership)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {}).join(', ');
    return res.status(409).json({
      status: 'fail',
      message: `Duplicate value for field: ${field}`,
    });
  }

  // Mongoose schema validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      status: 'fail',
      message: messages.join('. '),
    });
  }

  // JWT errors (bad signature / expired)
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired token. Please log in again.',
    });
  }

  // Unknown/programming error -> don't leak internals
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong on our end.',
  });
};
