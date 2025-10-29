module.exports = {
  testEnvironment: 'node',
  testTimeout: 120000,
  setupFilesAfterEnv: ['<rootDir>/init.js'],
  testMatch: ['**/?(*.)+(e2e).[jt]s']
};
