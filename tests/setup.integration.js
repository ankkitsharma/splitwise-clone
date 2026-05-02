/**
 * Runs before each test file. Must set DB_* before any module imports `src/config/database`.
 */
process.env.DB_DIALECT = "sqlite";
process.env.DB_STORAGE = ":memory:";
process.env.NODE_ENV = "test";
process.env.SERVER_JWT = "true";
process.env.SERVER_JWT_SECRET = "test-jwt-secret-key-for-integration-tests-only";
process.env.SERVER_JWT_TIMEOUT = "3600";
