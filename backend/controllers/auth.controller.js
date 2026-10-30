const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  role: user.role,
  createdAt: user.createdAt,
});

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    phone: phone || '',
  });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token: generateToken(user._id),
    user: authPayload(user),
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user) throw new ApiError(401, 'Invalid email or password');
  if (user.isBlocked) throw new ApiError(403, 'Your account has been blocked. Please contact support.');

  const matches = await user.comparePassword(password);
  if (!matches) throw new ApiError(401, 'Invalid email or password');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: 'Welcome back!',
    token: generateToken(user._id),
    user: authPayload(user),
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: authPayload(req.user) });
});

// PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  if (typeof req.body.name === 'string') user.name = req.body.name.trim();
  if (typeof req.body.phone === 'string') user.phone = req.body.phone.trim();
  if (req.body.address && typeof req.body.address === 'object') {
    const allowed = ['fullName', 'phone', 'street', 'city', 'state', 'postalCode', 'country'];
    const address = {};
    for (const key of allowed) {
      if (req.body.address[key] !== undefined) address[key] = String(req.body.address[key]).trim();
    }
    user.address = { ...(user.address?.toObject?.() || user.address || {}), ...address };
  }

  await user.save();
  res.json({ success: true, message: 'Profile updated', user: authPayload(user) });
});

// PUT /api/auth/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!user) throw new ApiError(404, 'User not found');

  const matches = await user.comparePassword(currentPassword);
  if (!matches) throw new ApiError(400, 'Current password is incorrect');
  if (currentPassword === newPassword) {
    throw new ApiError(400, 'New password must be different from the current password');
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
    token: generateToken(user._id),
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (_req, res) => {
  // JWTs are stateless; the client removes the token. The endpoint exists so
  // the frontend has a consistent server round-trip for logout.
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = { register, login, getMe, updateProfile, changePassword, logout };
