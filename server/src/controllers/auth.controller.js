const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const SALT_ROUNDS = 12;

// Token payload holds ONLY { id, email } — no tenantId/role. See
// tenant.middleware.js for why: those are looked up fresh on every request.
const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sanitizeUser = (user) => ({
  id: user._id,
  email: user.email,
  fullName: user.fullName,
  createdAt: user.createdAt,
});

const register = catchAsync(async (req, res, next) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return next(new AppError('email, password and fullName are required.', 400));
  }
  if (password.length < 8) {
    return next(new AppError('Password must be at least 8 characters.', 400));
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return next(new AppError('An account with this email already exists.', 409));
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email: normalizedEmail, passwordHash, fullName: fullName.trim() });

  // Deliberately no token here — register only creates the account.
  // The client calls /api/auth/login separately to get a JWT.
  res.status(201).json({ status: 'success', data: { user: sanitizeUser(user) } });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('email and password are required.', 400));
  }

  const normalizedEmail = email.toLowerCase().trim();
  // passwordHash has select:false on the schema, so it must be opted back in.
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  // Same generic message whether the email doesn't exist or the password is
  // wrong — never reveal which one, that's a user-enumeration leak.
  if (!user) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return next(new AppError('Incorrect email or password.', 401));
  }

  const token = signToken(user);
  res.status(200).json({ status: 'success', token, data: { user: sanitizeUser(user) } });
});

module.exports = { register, login };
