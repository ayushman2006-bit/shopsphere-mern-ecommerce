const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (process.env.USE_MEMORY_DB === 'true') {
    // Optional demo/CI mode: runs a real MongoDB server in memory.
    // Data disappears when the process stops, so it is not for production.
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('shopsphere');
    console.log('Using in-memory MongoDB (demo mode)');
  }

  if (!uri) {
    throw new Error('MONGODB_URI is not configured. Copy backend/.env.example to backend/.env.');
  }

  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10,
  });

  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err.message);
  });

  return conn;
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

module.exports = { connectDB, disconnectDB };
