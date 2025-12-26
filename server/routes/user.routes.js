const express = require('express');
const User = require('../models/user.model');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post(
  '/',
  auth,
  checkRole(['admin']),
  asyncHandler(async (req, res) => {
    const { email, password, name, role, tenantId } = req.body;
    const resolvedTenant = tenantId || req.user.tenantId;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'email, password, and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    const allowedRoles = Object.values(User.ROLES);
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existing = await User.findOne({ email, tenantId: resolvedTenant });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const user = new User({ email, password, name, tenantId: resolvedTenant, role: role || User.ROLES.VIEWER });
    await user.save();

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
    });
  })
);

router.patch(
  '/:id/role',
  auth,
  checkRole(['admin']),
  asyncHandler(async (req, res) => {
    const { role } = req.body;
    const allowedRoles = Object.values(User.ROLES);
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    await user.save();

    return res.json({ id: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId });
  })
);

module.exports = router;
