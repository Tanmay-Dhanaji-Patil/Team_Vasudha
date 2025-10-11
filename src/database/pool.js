const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.aundcwgdakyttydeqbca:VASUDHA@123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

module.exports = pool;