const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const httpStatus = require('../constants/httpStatus');
const generateToken = require('../utils/generateToken');
const { getClientDeviceInfo, isKnownDeviceOrLocation } = require('../utils/deviceHelper');
const { sendOtpEmail } = require('../services/emailService');
const { sendSmsOtp } = require('../services/smsService');

// Helper to generate 6-digit OTP code
const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Register user with City, Pincode & Signup OTP Verification
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, phoneNumber, city, pincode, otpChannel = 'email' } = req.body;

  // Validation
  if (!name || !email || !password || !city || !pincode) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide name, email, password, city, and 6-digit pincode'));
  }

  if (otpChannel === 'sms' && !phoneNumber) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide a valid mobile phone number for Mobile SMS OTP delivery.'));
  }

  // Validate 6-digit pincode format
  if (!/^\d{6}$/.test(pincode.toString().trim())) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please enter a valid 6-digit postal pincode (e.g. 110001)'));
  }

  // Check for existing user
  let user = await User.findOne({ email });
  if (user) {
    if (user.isVerified) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'An account with this email address already exists. Please Sign In.'));
    }
    // Remove stale unverified account to re-create cleanly
    await User.deleteOne({ _id: user._id });
  }

  const clientDevice = getClientDeviceInfo(req);
  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create new unverified user
  user = await User.create({
    name,
    email,
    password,
    phoneNumber: phoneNumber || '',
    city: city.trim(),
    pincode: pincode.trim(),
    knownDevices: [clientDevice],
    isVerified: false,
    otp: {
      code: otpCode,
      expiresAt,
      purpose: 'SIGNUP_VERIFICATION'
    }
  });

  // Dispatch OTP asynchronously without blocking the HTTP response
  if (otpChannel === 'sms') {
    sendSmsOtp({ phoneNumber: user.phoneNumber, otpCode, purpose: 'SIGNUP_VERIFICATION' }).catch(err => console.error('SMS send error:', err));
  } else if (otpChannel === 'both') {
    sendOtpEmail({ user, otpCode, purpose: 'SIGNUP_VERIFICATION' }).catch(err => console.error('Email send error:', err));
    if (user.phoneNumber) {
      sendSmsOtp({ phoneNumber: user.phoneNumber, otpCode, purpose: 'SIGNUP_VERIFICATION' }).catch(err => console.error('SMS send error:', err));
    }
  } else {
    // Default: Email
    sendOtpEmail({ user, otpCode, purpose: 'SIGNUP_VERIFICATION' }).catch(err => console.error('Email send error:', err));
  }

  const hasSmtp = !!(process.env.SMTP_USER || process.env.EMAIL_USER);

  res.status(httpStatus.CREATED).json(
    new ApiResponse(httpStatus.CREATED, {
      requireOtp: true,
      email: user.email,
      phoneNumber: user.phoneNumber,
      otpChannel,
      purpose: 'SIGNUP_VERIFICATION',
      ...(!hasSmtp && { otpPreview: otpCode })
    }, hasSmtp ? `Registration initiated. 6-digit OTP code sent to your Gmail inbox!` : `[Demo Mode OTP]: ${otpCode} (Configure SMTP_USER & SMTP_PASS in Render env for real Gmail delivery).`)
  );
});

// @desc    Login user with New Device / Location Detection & OTP Security
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide an email and password'));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials'));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials'));
  }

  // Update rememberMe preference in DB
  user.rememberMe = Boolean(rememberMe);

  const clientDevice = getClientDeviceInfo(req);

  // Check if current device & location is known
  const isKnown = isKnownDeviceOrLocation(user, clientDevice);

  if (!isKnown) {
    // Generate 6-digit OTP for new device/location security verification
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = {
      code: otpCode,
      expiresAt,
      purpose: 'LOGIN_NEW_DEVICE'
    };
    await user.save();

    // Dispatch OTP via Email & SMS
    sendOtpEmail({ user, otpCode, purpose: 'LOGIN_NEW_DEVICE' }).catch(err => console.error(err));
    sendSmsOtp({ phoneNumber: user.phoneNumber, otpCode, purpose: 'LOGIN_NEW_DEVICE' }).catch(err => console.error(err));

    return res.status(httpStatus.OK).json(
      new ApiResponse(httpStatus.OK, {
        requireOtp: true,
        email: user.email,
        phoneNumber: user.phoneNumber,
        purpose: 'LOGIN_NEW_DEVICE',
        city: clientDevice.city,
        state: clientDevice.state
      }, `New login location/device detected (${clientDevice.city}, ${clientDevice.state}). OTP verification required.`)
    );
  }

  // Update last used timestamp for known device
  const deviceIndex = user.knownDevices.findIndex(d => d.deviceId === clientDevice.deviceId);
  if (deviceIndex > -1) {
    user.knownDevices[deviceIndex].lastUsedAt = new Date();
  }
  await user.save();

  const token = generateToken(user._id, rememberMe ? '30d' : '7d');

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        subscription: user.subscription,
        avatar: user.avatar,
        themePreference: user.themePreference,
        rememberMe: user.rememberMe
      },
      token,
    }, 'Login successful')
  );
});

// @desc    Verify OTP for Login or Forgot Password
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOtp = asyncHandler(async (req, res, next) => {
  const { email, otpCode, purpose } = req.body;

  if (!email || !otpCode) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide email and 6-digit OTP code'));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'User not found'));
  }

  if (!user.otp || !user.otp.code) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'No active OTP verification code found. Please request a new OTP.'));
  }

  // Check expiration
  if (new Date() > new Date(user.otp.expiresAt)) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'OTP code has expired. Please request a new OTP.'));
  }

  // Validate OTP code
  if (user.otp.code !== otpCode.toString().trim()) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP code. Please check and try again.'));
  }

  // Handle Signup OTP Verification
  if (purpose === 'SIGNUP_VERIFICATION' || user.otp.purpose === 'SIGNUP_VERIFICATION') {
    const clientDevice = getClientDeviceInfo(req);

    user.isVerified = true;
    user.knownDevices = [clientDevice];
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id);

    return res.status(httpStatus.OK).json(
      new ApiResponse(httpStatus.OK, {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          city: user.city,
          pincode: user.pincode,
          role: user.role,
          subscription: user.subscription,
          avatar: user.avatar,
          themePreference: user.themePreference
        },
        token,
      }, 'Account verified successfully! Welcome to Watch Together.')
    );
  }

  // Handle Login Verification for New Device
  if (purpose === 'LOGIN_NEW_DEVICE' || user.otp.purpose === 'LOGIN_NEW_DEVICE') {
    const clientDevice = getClientDeviceInfo(req);

    // Save new device/location to knownDevices
    user.knownDevices.push(clientDevice);
    user.otp = undefined;
    await user.save();

    const token = generateToken(user._id);

    return res.status(httpStatus.OK).json(
      new ApiResponse(httpStatus.OK, {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          city: user.city,
          pincode: user.pincode,
          role: user.role,
          subscription: user.subscription,
          avatar: user.avatar,
          themePreference: user.themePreference
        },
        token,
      }, 'Device verified successfully. Welcome to Watch Together!')
    );
  }

  // Handle Forgot Password OTP Verification
  return res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {
      email: user.email,
      verified: true
    }, 'OTP verified. You may now reset your password.')
  );
});

// @desc    Resend OTP via specified channel (email or sms)
// @route   POST /api/v1/auth/resend-otp
// @access  Public
exports.resendOtp = asyncHandler(async (req, res, next) => {
  const { email, otpChannel = 'email', purpose } = req.body;

  if (!email) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide registered email address'));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'User not found'));
  }

  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const activePurpose = purpose || user.otp?.purpose || 'SIGNUP_VERIFICATION';

  user.otp = {
    code: otpCode,
    expiresAt,
    purpose: activePurpose
  };
  await user.save();

  if (otpChannel === 'sms') {
    if (!user.phoneNumber) {
      return next(new ApiError(httpStatus.BAD_REQUEST, 'No mobile phone number found for this account. Please select Email delivery.'));
    }
    await sendSmsOtp({ phoneNumber: user.phoneNumber, otpCode, purpose: activePurpose });
    return res.status(httpStatus.OK).json(
      new ApiResponse(httpStatus.OK, {
        email: user.email,
        phoneNumber: user.phoneNumber,
        otpChannel: 'sms'
      }, `A new 6-digit OTP code has been sent to your mobile number (${user.phoneNumber}) via Mobile SMS.`)
    );
  }

  // Default: Email
  sendOtpEmail({ user, otpCode, purpose: activePurpose }).catch(err => console.error('Email resend error:', err));
  const hasSmtp = !!(process.env.SMTP_USER || process.env.EMAIL_USER);

  return res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {
      email: user.email,
      phoneNumber: user.phoneNumber,
      otpChannel: 'email',
      ...(!hasSmtp && { otpPreview: otpCode })
    }, hasSmtp ? `A new 6-digit OTP code has been sent to your Gmail inbox (${user.email}).` : `[Demo Mode OTP]: ${otpCode}`)
  );
});

// @desc    Forgot Password - Request 6-digit OTP Code
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { identifier } = req.body;

  if (!identifier) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide registered email address or mobile number'));
  }

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase().trim() }, { phoneNumber: identifier.trim() }]
  });

  if (!user) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'No account found matching this email or mobile number'));
  }

  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.otp = {
    code: otpCode,
    expiresAt,
    purpose: 'FORGOT_PASSWORD'
  };
  await user.save();

  // Dispatch OTP via Email & SMS
  sendOtpEmail({ user, otpCode, purpose: 'FORGOT_PASSWORD' }).catch(err => console.error(err));
  sendSmsOtp({ phoneNumber: user.phoneNumber, otpCode, purpose: 'FORGOT_PASSWORD' }).catch(err => console.error(err));

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {
      email: user.email,
      phoneNumber: user.phoneNumber,
      purpose: 'FORGOT_PASSWORD'
    }, `Password reset OTP sent to registered email (${user.email}) and phone.`)
  );
});

// @desc    Reset Password with OTP Code & Instant Login
// @route   POST /api/v1/auth/reset-password-with-otp
// @access  Public
exports.resetPasswordWithOtp = asyncHandler(async (req, res, next) => {
  const { email, otpCode, newPassword } = req.body;

  if (!email || !otpCode || !newPassword) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Please provide email, OTP code, and new password'));
  }

  if (newPassword.length < 6) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'New password must be at least 6 characters long'));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ApiError(httpStatus.NOT_FOUND, 'User not found'));
  }

  if (!user.otp || !user.otp.code) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'No active OTP verification code found. Please request a new OTP.'));
  }

  if (new Date() > new Date(user.otp.expiresAt)) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'OTP code has expired. Please request a new OTP.'));
  }

  if (user.otp.code !== otpCode.toString().trim()) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid OTP code. Please check and try again.'));
  }

  // Update Password
  user.password = newPassword;
  user.otp = undefined;
  await user.save();

  const token = generateToken(user._id);

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        subscription: user.subscription,
        avatar: user.avatar,
        themePreference: user.themePreference
      },
      token,
    }, 'Password reset successful! Welcome back to Watch Together.')
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

// @desc    Update user theme preference (auto, light, dark)
// @route   PUT /api/v1/auth/theme
// @access  Private
exports.updateThemePreference = asyncHandler(async (req, res, next) => {
  const { themePreference } = req.body;

  if (!['auto', 'light', 'dark'].includes(themePreference)) {
    return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid theme preference. Choose auto, light, or dark.'));
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { themePreference },
    { returnDocument: 'after' }
  );

  res.status(httpStatus.OK).json(
    new ApiResponse(httpStatus.OK, {
      themePreference: user.themePreference,
      user
    }, 'Theme preference updated successfully')
  );
});
