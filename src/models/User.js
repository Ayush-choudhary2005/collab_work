const mongoose = require('mongoose');

// No tenant data here by design. A User is a single global identity that
// can hold separate Memberships (and therefore different roles) across
// many tenants/workspaces.
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
