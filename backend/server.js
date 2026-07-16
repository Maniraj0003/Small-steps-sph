// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_please_change_this_in_production!'; // Set JWT_SECRET in env for production

// DB choice: Postgres when DATABASE_URL is set, otherwise SQLite
const isPostgres = !!process.env.DATABASE_URL;
let sqlite3 = null;
let db = null;
let pgPool = null;

async function initDb() {
  if (isPostgres) {
    // Use Postgres
    const { Pool } = require('pg');
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Ensure users table exists
    await pgPool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL
    )`);
    console.log('Connected to Postgres and ensured users table exists.');
  } else {
    // Use SQLite
    sqlite3 = require('sqlite3').verbose();
    const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'smallsteps.db');
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening SQLite database:', err.message);
      }
    });
    // Create users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      } else {
        console.log('Connected to SQLite and ensured users table exists.');
      }
    });
  }
}

function dbGet(sql, params) {
  if (isPostgres) {
    return pgPool.query(sql, params).then(r => r.rows[0]);
  } else {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}

function dbRun(sql, params) {
  if (isPostgres) {
    return pgPool.query(sql, params);
  } else {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID });
      });
    });
  }
}

// --- Middleware ---
// Configure CORS with optional ALLOWED_ORIGINS env var (comma-separated list).
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : null;
app.use(cors({
    origin: function(origin, callback) {
        // Allow non-browser requests (curl, Postman) which have no origin
        if (!origin) return callback(null, true);
        // If no ALLOWED_ORIGINS set, allow all origins (development)
        if (!allowedOrigins || allowedOrigins.length === 0) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        } else {
            return callback(new Error('CORS policy: This origin is not allowed'));
        }
    }
}));
app.use(bodyParser.json()); // To parse JSON request bodies

// --- API Endpoints ---

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    try {
        // Check if user with this email and role already exists
        const existing = await dbGet('SELECT * FROM users WHERE email = ? AND role = ?' , [email, role]);
        if (existing) {
          return res.status(409).json({ error: `A user with this email and role (${role}) already exists.` });
        }

        const passwordHash = await bcrypt.hash(password, 10); // Hash password

        if (isPostgres) {
          const result = await dbRun('INSERT INTO users (fullName, email, passwordHash, role) VALUES ($1, $2, $3, $4) RETURNING id', [fullName, email, passwordHash, role]);
          return res.status(201).json({ success: true, message: 'User registered successfully!', id: result.rows ? result.rows[0].id : null });
        } else {
          await dbRun('INSERT INTO users (fullName, email, passwordHash, role) VALUES (?, ?, ?, ?)', [fullName, email, passwordHash, role]);
          return res.status(201).json({ success: true, message: 'User registered successfully!' });
        }
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup.' });
    }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required.' });
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE email = ? AND role = ?', [email, role]);
        if (!user) {
          return res.status(401).json({ error: 'Invalid email, password, or role combination.' });
        }

        const storedHash = user.passwordHash || user.passwordhash || user.password_hash;
        const isMatch = await bcrypt.compare(password, storedHash);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email, password, or role combination.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        const fullName = user.fullName || user.fullname || user.full_name || '';

        res.status(200).json({
            token,
            user: {
                id: user.id,
                fullName: fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// --- Start the Server ---
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} using ${isPostgres ? 'Postgres' : 'SQLite'}`);
  });
}).catch(err => {
  console.error('Failed to initialize database', err);
  process.exit(1);
});