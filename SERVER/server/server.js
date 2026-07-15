const express = require('express');
const path = require('path');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// In-memory user storage (for demo only; use a database for production)
let users = [];

// === API ROUTES ===

// Signup Route
app.post('/api/signup', (req, res) => {
  const { fullName, email, password, role } = req.body;
  if (!fullName || !email || !password || !role) {
    return res.json({ success: false, error: "All fields required" });
  }
  if (users.find(u => u.email === email && u.role === role)) {
    return res.json({ success: false, error: "User already exists" });
  }
  users.push({ fullName, email, password, role });
  res.json({ success: true });
});

// Login Route
app.post('/api/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = users.find(u => u.email === email && u.password === password && u.role === role);
  if (!user) {
    return res.json({ success: false, error: "Invalid credentials" });
  }
  res.json({
    token: "demo-token",
    user: { fullName: user.fullName, email: user.email, role: user.role }
  });
});

// === STATIC FILES ===

// Serve static files (HTML, CSS, JS) from client folder
app.use(express.static(path.join(__dirname, '../client')));

// Fallback: Always return SM7.html for any route not handled above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/SM7.html'));
});

// === START SERVER ===

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
