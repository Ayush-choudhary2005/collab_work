const mongoose = require('mongoose');
const Membership = require('../models/Membership');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// MUST run AFTER verifyToken.
//
// Reads x-tenant-id from headers and confirms — freshly, on every request —
// that req.user actually belongs to that tenant. Attaches req.membership
// and req.tenantId, which every Project/Task controller must use to scope
// its queries. Never trust a tenantId coming from req.body or req.query;
// req.tenantId (set here, from a verified Membership) is the only
// trustworthy source.
const verifyTenant = catchAsync(async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];

  if (!tenantId) {
    return next(new AppError('Missing x-tenant-id header.', 400));
  }

  if (!mongoose.isValidObjectId(tenantId)) {
    return next(new AppError('Invalid x-tenant-id header.', 400));
  }

  const membership = await Membership.findOne({
    userId: req.user.id,
    tenantId,
  });

  if (!membership) {
    return next(new AppError('You do not have access to this workspace.', 403));
  }

  req.membership = membership;
  req.tenantId = membership.tenantId;
  next();
});

// Convenience factory for role gates, e.g. requireRole('owner', 'admin').
// Must run after verifyTenant (depends on req.membership).
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.membership || !allowedRoles.includes(req.membership.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

module.exports = { verifyTenant, requireRole };
