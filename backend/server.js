// backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_super_secret_jwt_key_please_change_this_in_production!'; // <--- CHANGE THIS IN PRODUCTION

// --- Database Setup ---
const dbPath = path.resolve(__dirname, 'smallsteps.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
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
                console.log('Users table checked/created.');
            }
        });
    }
});

// --- Middleware ---
app.use(cors()); // Allow all origins for development. For production, restrict to your frontend domain.
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
        db.get('SELECT * FROM users WHERE email = ? AND role = ?', [email, role], async (err, row) => {
            if (err) {
                return res.status(500).json({ error: 'Database error during signup.' });
            }
            if (row) {
                return res.status(409).json({ error: `A user with this email and role (${role}) already exists.` });
            }

            const passwordHash = await bcrypt.hash(password, 10); // Hash password

            db.run('INSERT INTO users (fullName, email, passwordHash, role) VALUES (?, ?, ?, ?)',
                [fullName, email, passwordHash, role],
                function (err) {
                    if (err) {
                        return res.status(500).json({ error: 'Error inserting user into database.' });
                    }
                    res.status(201).json({ success: true, message: 'User registered successfully!' });
                }
            );
        });
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
        db.get('SELECT * FROM users WHERE email = ? AND role = ?', [email, role], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error during login.' });
            }
            if (!user) {
                return res.status(401).json({ error: 'Invalid email, password, or role combination.' });
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email, password, or role combination.' });
            }

            // Generate JWT
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '1h' } // Token expires in 1 hour
            );

            res.status(200).json({
                token,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});