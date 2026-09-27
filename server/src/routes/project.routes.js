const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { verifyTenant, requireRole } = require('../middleware/tenant.middleware');
const { createProject } = require('../controllers/project.controller');
const { getProjectTasks } = require('../controllers/task.controller');

const router = express.Router();

router.use(verifyToken, verifyTenant);

// Guests can view (spec: "Guests can only view and comment"), so no role
// gate on the GET. Creating a project is gated to owner/admin/member.
router.post('/', requireRole('owner', 'admin', 'member'), createProject);
router.get('/:projectId/tasks', getProjectTasks);

module.exports = router;
