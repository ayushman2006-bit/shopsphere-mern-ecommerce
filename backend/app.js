// Express application: middleware, routes and error handling.
// server.js starts it locally, and Vercel imports it as a serverless function.

const path = require('path');
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Allow the React app to call this API.
// CLIENT_URL can contain more than one address, separated by commas.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // No origin means a tool like curl or Postman.
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  })
);

// Read JSON data sent in request bodies.
app.use(express.json());

// Serve product images during local development.
// On Vercel, the same images are served from the frontend's public folder.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make sure MongoDB is connected before handling a request.
// connectDB() reuses the existing connection, so this is cheap after the first call.
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// A small route used to check that the API is running.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'ShopSphere API is running' });
});

// Main API routes.
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// If no route matched, return a 404 response.
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler. Routes call next(error) to reach this code.
app.use((error, _req, res, _next) => {
  console.error(error);

  // Invalid MongoDB id (for example /api/products/123)
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }

  // Mongoose validation error (for example a missing product name)
  if (error.name === 'ValidationError') {
    const firstError = Object.values(error.errors)[0];
    return res.status(400).json({ message: firstError.message });
  }

  // Duplicate key error (for example an email that already exists)
  if (error.code === 11000) {
    return res.status(400).json({ message: 'This email is already registered' });
  }

  // Database connection problem (for example a wrong MONGODB_URI)
  if (error.name === 'MongooseServerSelectionError') {
    return res.status(503).json({ message: 'Database is not reachable' });
  }

  res.status(500).json({ message: 'Something went wrong on the server' });
});

module.exports = app;
