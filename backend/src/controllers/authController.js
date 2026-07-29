const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('../constants/httpStatus');
const generateToken = require('../utils/generateToken');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide name, email, and password'));
  }

  // Check for duplicate email
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'User with this email already exists'));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  const token = generateToken(user._id);

  res.status(httpStatus.CREATED).json(
    new ApiResponse(httpStatus.CREATED, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
      },
      token,
    }, 'User registered successfully')
  );
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide an email and password'));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials'));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials'));
  }

  const token = generateToken(user._id);

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription,
        avatar: user.avatar,
      },
      token,
    }, 'Login successful')
  );
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {
      user,
    })
  );
});

// @desc    Log user out / clear cookie
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {}, 'Logged out successfully')
  );
});
