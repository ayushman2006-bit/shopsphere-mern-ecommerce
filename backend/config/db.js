const mongoose = require('mongoose');

// Vercel may reuse the same Node.js process for several requests.
// Keeping the connection in a global variable means we connect only once.
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { connection: null, promise: null };
}

// Connect to MongoDB using the URI from the environment.
// The promise is cached so parallel requests do not open several connections.
const connectDB = async () => {
  if (cached.connection) {
    return cached.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsphere';

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    cached.connection = await cached.promise;
    console.log(`MongoDB connected: ${cached.connection.connection.name}`);
    return cached.connection;
  } catch (error) {
    // Clear the failed promise so the next request can try again.
    cached.promise = null;
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

// Used by the seed script after it has finished inserting data.
const disconnectDB = async () => {
  await mongoose.disconnect();
  cached.connection = null;
  cached.promise = null;
};

module.exports = { connectDB, disconnectDB };
