const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const sanitizeTask = (t) => ({
  id: t._id,
  title: t.title,
  description: t.description,
  status: t.status,
  priority: t.priority,
  projectId: t.projectId,
  assigneeId: t.assigneeId,
  createdBy: t.createdBy,
  dueDate: t.dueDate,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});

const createTask = catchAsync(async (req, res, next) => {
  const { title, description, projectId, assigneeId, priority, dueDate } = req.body;

  if (!title || !title.trim()) {
    return next(new AppError('Task title is required.', 400));
  }
  if (!projectId || !mongoose.isValidObjectId(projectId)) {
    return next(new AppError('A valid projectId is required.', 400));
  }

  // projectId comes from the client and must never be trusted on its own.
  // Confirming it belongs to req.tenantId stops a member of Tenant A from
  // attaching a task to a project id that actually belongs to Tenant B.
  const project = await Project.findOne({ _id: projectId, tenantId: req.tenantId });
  if (!project) {
    return next(new AppError('Project not found in this workspace.', 404));
  }

  const task = await Task.create({
    title: title.trim(),
    description,
    projectId,
    tenantId: req.tenantId,
    assigneeId: assigneeId || null,
    priority,
    dueDate,
    createdBy: req.user.id,
  });

  res.status(201).json({ status: 'success', data: { task: sanitizeTask(task) } });
});

const getProjectTasks = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  if (!mongoose.isValidObjectId(projectId)) {
    return next(new AppError('Invalid projectId.', 400));
  }

  // Same tenant check as createTask: a project id from another tenant
  // should look exactly like a project that doesn't exist (404), never a
  // 403 — a 403 would confirm the id exists under someone else's tenant.
  const project = await Project.findOne({ _id: projectId, tenantId: req.tenantId });
  if (!project) {
    return next(new AppError('Project not found in this workspace.', 404));
  }

  const tasks = await Task.find({ projectId, tenantId: req.tenantId }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: tasks.length,
    data: { tasks: tasks.map(sanitizeTask) },
  });
});

const updateTaskStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return next(new AppError('Invalid task id.', 400));
  }

  const allowedStatuses = Task.schema.path('status').enumValues;
  if (!status || !allowedStatuses.includes(status)) {
    return next(new AppError(`status must be one of: ${allowedStatuses.join(', ')}`, 400));
  }

  // The tenantId filter here is the line that actually enforces isolation
  // on this write. Without it, any authenticated user could update ANY
  // task in the whole database just by guessing/knowing its Mongo _id —
  // the verifyTenant middleware alone does not protect this query; the
  // query itself has to be scoped too.
  const task = await Task.findOneAndUpdate(
    { _id: id, tenantId: req.tenantId },
    { status },
    { new: true, runValidators: true }
  );

  if (!task) {
    return next(new AppError('Task not found in this workspace.', 404));
  }

  res.status(200).json({ status: 'success', data: { task: sanitizeTask(task) } });
});

module.exports = { createTask, getProjectTasks, updateTaskStatus };
