const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { verifyTenant, requireRole } = require('../middleware/tenant.middleware');
const { createTask, updateTaskStatus } = require('../controllers/task.controller');

const router = express.Router();

router.use(verifyToken, verifyTenant);

// Spec: "Members can create tasks" (guests can't). Same gate applies to
// dragging a card to a new status column.
router.post('/', requireRole('owner', 'admin', 'member'), createTask);
router.put('/:id/status', requireRole('owner', 'admin', 'member'), updateTaskStatus);

module.exports = router;
