const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in-progress', 'in-review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },

    // --- RAG / "Chat with your data" support (wired up in a later phase) ---
    // text-embedding-3-small produces 1536-dimensional vectors.
    // select: false keeps these out of normal API responses and payload size.
    embedding: {
      type: [Number],
      select: false,
      default: undefined,
    },
    embeddingUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

taskSchema.index({ tenantId: 1 });
taskSchema.index({ tenantId: 1, projectId: 1 });

// IMPORTANT: the Atlas Vector Search index on `embedding` is NOT created
// here — Mongoose can't define that. It's configured separately in
// MongoDB Atlas, and it MUST include `tenantId` as a filterable field so
// RAG queries can be strictly scoped per-tenant at the vector-search level,
// not just in application code (see spec section 2C).

module.exports = mongoose.model('Task', taskSchema);
