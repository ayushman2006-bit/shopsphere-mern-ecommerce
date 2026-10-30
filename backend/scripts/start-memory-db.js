require('dotenv').config();
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  const port = Number(process.env.MEMORY_DB_PORT) || 27017;
  const mongod = await MongoMemoryServer.create({
    instance: {
      port,
      dbName: 'shopsphere',
      storageEngine: 'wiredTiger',
    },
  });

  console.log('In-memory MongoDB is running.');
  console.log(`MONGODB_URI=${mongod.getUri('shopsphere')}`);
  console.log('This database is ephemeral. Press Ctrl+C to stop.');

  const stop = async () => {
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch((error) => {
  console.error('Could not start in-memory MongoDB:', error);
  process.exit(1);
});
