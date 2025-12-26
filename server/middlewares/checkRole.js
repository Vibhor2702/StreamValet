/**
 * Enforce RBAC; assumes auth middleware already populated req.user.
 * @param {string[]} allowedRoles
 */
function checkRole(allowedRoles = []) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}

module.exports = checkRole;
