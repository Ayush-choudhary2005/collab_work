const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'guest'],
      default: 'member',
      required: true,
    },
  },
  { timestamps: true }
);

// A user can only have ONE membership (one role) per tenant.
membershipSchema.index({ userId: 1, tenantId: 1 }, { unique: true });

// Fast "who's in this workspace" lookups — used by verifyTenant on every
// request, and later by the Smart Triage / workload-aware auto-assign feature.
membershipSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Membership', membershipSchema);
