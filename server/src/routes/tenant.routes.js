const express = require('express');
const { verifyToken } = require('../middleware/auth.middleware');
const { createTenant, getMyWorkspaces } = require('../controllers/tenant.controller');

const router = express.Router();

// Every tenant route just needs a logged-in user — verifyTenant doesn't
// apply here since these endpoints are about WHICH tenants the user has,
// not an action inside one already-selected tenant.
router.use(verifyToken);

router.post('/', createTenant);
router.get('/my-workspaces', getMyWorkspaces);

module.exports = router;
