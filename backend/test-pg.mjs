// backend/test-pg.mjs
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://njirani:njirani_dev_pass@localhost:5432/njirani_test',
});

try {
  const res = await pool.query('SELECT 1');
  console.log('✅ RAW PG WORKS:', res.rows);
} catch (err) {
  console.error('❌ RAW PG FAILED:', err.message);
}
await pool.end();