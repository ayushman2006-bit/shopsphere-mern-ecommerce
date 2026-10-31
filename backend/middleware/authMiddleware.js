const jwt = require('jsonwebtoken');
const User = require('../models/User');

// This middleware protects routes that require a logged-in user.
// The React app sends the JWT in the "Authorization: Bearer <token>" header.
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please log in first' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user to the request so later routes can use req.user.
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

// This middleware runs after "protect" and allows only admins.
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  res.status(403).json({ message: 'Admin access only' });
};

module.exports = { protect, adminOnly };
