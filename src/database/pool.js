const { Pool } = require('pg');

// Load environment variables in Node.js
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Validate database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is missing. Please check your .env.local file.');
}

module.exports = pool;
