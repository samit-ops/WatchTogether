const jwt = require('jsonwebtoken');

const generateToken = (id, expiresIn = null) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_for_dev', {
    expiresIn: expiresIn || process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = generateToken;
