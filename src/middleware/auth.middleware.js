const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Verifies the JWT and attaches the authenticated user's id to req.user.
//
// NOTE: By design, the token payload holds ONLY { id, email } — no
// tenantId or role. tenantId/role are intentionally looked up FRESH from
// the Membership collection on every request (see verifyTenant below),
// so a revoked or changed membership takes effect immediately instead of
// waiting for the token to expire.
const verifyToken = catchAsync(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(err); // caught centrally as JsonWebTokenError / TokenExpiredError
  }

  req.user = { id: decoded.id, email: decoded.email };
  next();
});

module.exports = { verifyToken };
