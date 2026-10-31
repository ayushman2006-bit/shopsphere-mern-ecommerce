// ShopSphere - simple MERN online shopping system
// This file starts the Express server and connects all the routes.

require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Allow the React development server to call this API.
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));

// Read JSON data sent in request bodies.
app.use(express.json());

// Serve product images from the uploads folder.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

  res.status(500).json({ message: 'Something went wrong on the server' });
});

// Connect to MongoDB first, then start listening for requests.
const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Copy backend/.env.example to backend/.env.');
    process.exit(1);
  }

  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
};

startServer();
