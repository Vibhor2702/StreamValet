const express = require('express');
const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');
const { issueToken } = require('../utils/jwt');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Login only; registration is disabled for security.
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password, tenantId } = req.body;

    if (!email || !password || !tenantId) {
      return res.status(400).json({ message: 'Missing credentials' });
    }

    const user = await User.findOne({ email, tenantId }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = issueToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId } });
  })
);

module.exports = router;
