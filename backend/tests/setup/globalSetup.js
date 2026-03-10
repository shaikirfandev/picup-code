/**
 * Global setup — starts MongoMemoryServer once for all test suites.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27018 },
  });
  const uri = mongod.getUri();
  process.env.MONGO_URI_TEST = uri;
  // Store the instance so globalTeardown can stop it
  globalThis.__MONGOD__ = mongod;
};
