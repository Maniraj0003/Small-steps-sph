// backend/db_postgres.js
// Simple PostgreSQL helper using node-postgres (pg)
// This is a scaffold to help migrate from SQLite to Postgres. It expects DATABASE_URL in env.

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('executed query', { text, duration, rows: res.rowCount });
  return res;
}

module.exports = {
  query,
  pool
};
