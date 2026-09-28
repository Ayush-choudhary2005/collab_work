const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// Runs after verifyTenant, so req.tenantId is a verified value — never
// taken from req.body. This is the entire tenant-isolation guarantee for
// writes: the project can ONLY ever be created under the caller's own tenant.
const createProject = catchAsync(async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return next(new AppError('Project name is required.', 400));
  }

  const project = await Project.create({ name: name.trim(), tenantId: req.tenantId });

  res.status(201).json({
    status: 'success',
    data: { project: { id: project._id, name: project.name, tenantId: project.tenantId } },
  });
});

// Lists ONLY the projects of the caller's verified tenant. Any workspace
// member (including guests) can view — no role gate on this one.
const getProjects = catchAsync(async (req, res, next) => {
  const projects = await Project.find({ tenantId: req.tenantId }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: projects.length,
    data: {
      projects: projects.map((p) => ({
        id: p._id,
        name: p.name,
        tenantId: p.tenantId,
        createdAt: p.createdAt,
      })),
    },
  });
});

module.exports = { createProject, getProjects };
