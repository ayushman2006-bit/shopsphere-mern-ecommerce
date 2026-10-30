const ApiError = require('../utils/ApiError');

/**
 * Must run after `protect`. Enforces role-based authorization on the server;
 * hiding admin links in the UI is never treated as security.
 */
const admin = (req, _res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Admin access required'));
  }
  next();
};

module.exports = admin;
