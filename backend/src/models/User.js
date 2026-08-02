const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    subscription: {
      type: String,
      enum: ['Free', 'Bronze', 'Silver', 'Gold'],
      default: 'Free',
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    themePreference: {
      type: String,
      enum: ['auto', 'light', 'dark'],
      default: 'auto',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
    },
    knownDevices: [
      {
        deviceId: String,
        city: String,
        state: String,
        country: String,
        ip: String,
        userAgent: String,
        lastUsedAt: { type: Date, default: Date.now }
      }
    ],
    otp: {
      code: String,
      expiresAt: Date,
      purpose: {
        type: String,
        enum: ['LOGIN_NEW_DEVICE', 'FORGOT_PASSWORD', 'SIGNUP_VERIFICATION']
      }
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
