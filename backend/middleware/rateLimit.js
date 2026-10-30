const rateLimit = require('express-rate-limit');

const isTest = () => process.env.NODE_ENV === 'test';

const envLimit = (name, fallback) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: envLimit('AUTH_RATE_LIMIT_MAX', 50),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: envLimit('REGISTER_RATE_LIMIT_MAX', 20),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: 'Too many accounts created from this address. Please try again later.',
  },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: envLimit('API_RATE_LIMIT_MAX', 1500),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: isTest,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
});

module.exports = { authLimiter, registerLimiter, apiLimiter };
