// serverless/vercel_signup_example.js
// Example Vercel Serverless function for signup using Postgres
// Save as /api/signup.js in a Vercel project and set DATABASE_URL and JWT_SECRET in Vercel env.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password || !role) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hashed = await bcrypt.hash(password, 10);
    const insert = await pool.query(
      'INSERT INTO users (fullname, email, passwordhash, role) VALUES ($1, $2, $3, $4) RETURNING id, fullname, email, role',
      [fullName, email, hashed, role]
    );
    const user = insert.rows[0];
    return res.status(201).json({ success: true, user });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') return res.status(409).json({ error: 'User already exists' });
    return res.status(500).json({ error: 'Server error' });
  }
};
