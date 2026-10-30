/**
 * Lightweight NoSQL-injection guard. Removes keys that begin with "$"
 * or contain "." (MongoDB operators / dotted paths) from req.body,
 * req.query and req.params.
 */
const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const clean = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }
  return value;
};

const mongoSanitize = (req, _res, next) => {
  if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
  if (req.query && typeof req.query === 'object') req.query = sanitizeValue(req.query);
  if (req.params && typeof req.params === 'object') req.params = sanitizeValue(req.params);
  next();
};

module.exports = mongoSanitize;
