const mongoose = require('mongoose');
const crypto = require('crypto');
const Tenant = require('../models/Tenant');
const Membership = require('../models/Membership');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// Creates a Tenant AND the creator's 'owner' Membership together.
// These two writes are wrapped in a transaction on purpose: without it, a
// crash between the two `create` calls would leave an orphaned Tenant with
// no owner — a workspace nobody can access or administer.
const createTenant = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return next(new AppError('Workspace name is required.', 400));
  }

  // Random suffix keeps slugs unique without needing a retry/collision loop.
  const slug = `${slugify(name)}-${crypto.randomBytes(3).toString('hex')}`;

  const session = await mongoose.startSession();
  let tenant;
  try {
    await session.withTransaction(async () => {
      const created = await Tenant.create([{ name: name.trim(), slug }], { session });
      tenant = created[0];
      await Membership.create(
        [{ userId: req.user.id, tenantId: tenant._id, role: 'owner' }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({
    status: 'success',
    data: { tenant: { id: tenant._id, name: tenant.name, slug: tenant.slug, role: 'owner' } },
  });
});

const getMyWorkspaces = catchAsync(async (req, res, next) => {
  const memberships = await Membership.find({ userId: req.user.id }).populate('tenantId', 'name slug');

  const workspaces = memberships
    .filter((m) => m.tenantId) // guards against a dangling ref if a tenant doc were ever deleted
    .map((m) => ({
      id: m.tenantId._id,
      name: m.tenantId.name,
      slug: m.tenantId.slug,
      role: m.role,
    }));

  res.status(200).json({ status: 'success', results: workspaces.length, data: { workspaces } });
});

module.exports = { createTenant, getMyWorkspaces };
