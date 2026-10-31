const mongoose = require('mongoose');

// Connect to MongoDB using the URI from the .env file.
// If no URI is given, we fall back to a local database called "shopsphere".
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsphere';

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Used by the seed script after it has finished inserting data.
const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = { connectDB, disconnectDB };
