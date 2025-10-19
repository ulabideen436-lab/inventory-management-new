const path = require('path');
const dotenv = require('dotenv');

// Load .env from the backend folder
dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'storeflow'
  },
  migrations: {
    directory: path.resolve(__dirname, 'migrations')
  }
};
