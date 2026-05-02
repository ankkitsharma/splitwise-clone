require('dotenv/config');

const define = { timestamps: true };

if (process.env.DB_DIALECT === 'sqlite') {
  module.exports = {
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || ':memory:',
    define,
    logging: false,
  };
} else {
  module.exports = {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    define,
  };
}

