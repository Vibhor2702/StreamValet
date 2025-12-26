const jwt = require('jsonwebtoken');
const config = require('../config');

function issueToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

module.exports = {
  issueToken,
};
