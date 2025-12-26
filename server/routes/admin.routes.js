const express = require('express');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const asyncHandler = require('../utils/asyncHandler');
const { getSmartStats } = require('../services/stats.service');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Admin-only metrics for the current tenant.
router.get(
  '/metrics',
  auth,
  checkRole(['admin']),
  asyncHandler(async (req, res) => {
    const stats = await getSmartStats(req.user.tenantId);
    res.json(stats);
  })
);

module.exports = router;
