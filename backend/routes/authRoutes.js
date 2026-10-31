const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a JWT containing the user's id. It stays valid for 7 days.
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register - create a new customer account.
router.post('/register', async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please fill in all fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // New accounts are always customers. Admin accounts are created by the seed script.
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: 'user',
    });

    res.status(201).json({
      token: createToken(user._id),
      user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login - check the email and password, then return a token.
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter your email and password' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // matchPassword() is defined in models/User.js and uses bcrypt.compare().
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: createToken(user._id),
      user,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - return the logged-in user's details.
// The React app calls this after a page refresh to restore the session.
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;
