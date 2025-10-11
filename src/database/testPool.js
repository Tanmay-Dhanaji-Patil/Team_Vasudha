const pool = require('./pool');

async function testPoolConnection() {
  try {
    const res = await pool.query('SELECT 1');
    console.log('Pooler connection successful:', res.rows);
  } catch (err) {
    console.error('Pooler connection error:', err);
  } finally {
    await pool.end();
  }
}

testPoolConnection();