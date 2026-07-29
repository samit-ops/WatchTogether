const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ApiError = require('../utils/ApiError');
const httpStatus = require('../constants/httpStatus');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized to access this route')
    );
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_dev');

    req.user = await User.findById(decoded.id);
    
    if (!req.user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'User no longer exists'));
    }

    next();
  } catch (err) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized to access this route'));
  }
});

module.exports = { protect };
