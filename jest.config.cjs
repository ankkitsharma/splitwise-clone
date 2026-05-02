/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["**/tests/integration/**/*.integration.test.js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.integration.js"],
  testTimeout: 30_000,
  maxWorkers: 1,
  transform: {
    "\\.js$": ["@sucrase/jest-plugin", { transforms: ["imports"] }],
  },
};
