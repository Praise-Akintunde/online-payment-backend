require('dotenv').config();
const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// MySQL Connection
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'jupiter_db'
});

// Nodemailer Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// JWT Middleware with SQL Token Check
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Authorization Header:', authHeader); // DEBUG

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided (header missing)' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided (token missing in header)' });
  }

  // Check token exists in DB
  db.query('SELECT * FROM tokens WHERE token = ?', [token], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(403).json({ message: 'Token expired or invalidated' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Invalid token' });
      req.user = user;
      next();
    });
  });
}

// HTML Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'landing.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signup.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/forgot', (req, res) => res.sendFile(path.join(__dirname, 'public', 'forgot.html')));
app.get('/reset', (req, res) => res.sendFile(path.join(__dirname, 'public', 'reset.html')));

// Signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).send('Server error');
    if (results.length > 0) return res.status(400).send('User already exists');

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        (err) => {
          if (err) return res.status(500).send('Error creating user');
          res.status(201).send('Signup successful');
        }
      );
    } catch {
      res.status(500).send('Password hashing failed');
    }
  });
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });

    db.query('INSERT INTO tokens (user_id, token) VALUES (?, ?)', [user.id, token], (err) => {
      if (err) return res.status(500).json({ message: 'Token storage failed' });

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    });
  });
});

// Logout
app.post('/logout', authenticateToken, (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];

  db.query('DELETE FROM tokens WHERE token = ?', [token], (err) => {
    if (err) return res.status(500).json({ message: 'Logout error' });
    res.json({ message: 'Logged out successfully' });
  });
});

// Forgot Password
app.post('/forgot', (req, res) => {
  const { email } = req.body;
  const code = crypto.randomBytes(3).toString('hex');

  db.query('UPDATE users SET reset_code = ? WHERE email = ?', [code, email], (err, result) => {
    if (err) return res.status(500).send('Server error');
    if (result.affectedRows === 0) return res.status(404).send('Email not found');

    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Your Jupiter Reset Code',
      text: `Your reset code is: ${code}`
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) return res.status(500).send('Failed to send reset code');
      res.send('Reset code sent to your email');
    });
  });
});

// Reset Password
app.post('/reset', async (req, res) => {
  const { code, newPassword } = req.body;

  db.query('SELECT * FROM users WHERE reset_code = ?', [code], async (err, results) => {
    if (err) return res.status(500).send('Server error');
    if (results.length === 0) return res.status(400).send('Invalid reset code');

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query(
        'UPDATE users SET password = ?, reset_code = NULL WHERE reset_code = ?',
        [hashedPassword, code],
        (err) => {
          if (err) return res.status(500).send('Reset failed');
          res.send('Password reset successfully');
        }
      );
    } catch {
      res.status(500).send('Hashing failed');
    }
  });
});

// Unprotected Home Page (No JWT required)
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Protected User Profile
app.get('/user/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query('SELECT username, email, image, cards FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json(results[0]);
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Jupiter server running at http://localhost:${PORT}`);
});
