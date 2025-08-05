const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/connection');
const sendResetEmail = require('../config/mailer');
const JWT_SECRET = process.env.JWT_SECRET;

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).send('Server error');
    if (results.length > 0) return res.status(400).send('User already exists');

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], (err) => {
        if (err) return res.status(500).send('Error creating user');
        res.status(201).send('Signup successful');
      });
    } catch {
      res.status(500).send('Password hashing failed');
    }
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });

    db.query('INSERT INTO tokens (user_id, token) VALUES (?, ?)', [user.id, token], (err) => {
      if (err) return res.status(500).json({ message: 'Token storage failed' });

      res.status(200).json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    });
  });
};

exports.logout = (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  db.query('DELETE FROM tokens WHERE token = ?', [token], (err) => {
    if (err) return res.status(500).json({ message: 'Logout error' });
    res.json({ message: 'Logged out successfully' });
  });
};

exports.forgot = (req, res) => {
  const { email } = req.body;
  const code = crypto.randomBytes(3).toString('hex');

  db.query('UPDATE users SET reset_code = ? WHERE email = ?', [code, email], (err, result) => {
    if (err) return res.status(500).send('Server error');
    if (result.affectedRows === 0) return res.status(404).send('Email not found');

    sendResetEmail(email, code)
      .then(() => res.send('Reset code sent to your email'))
      .catch(() => res.status(500).send('Failed to send reset code'));
  });
};

exports.reset = async (req, res) => {
  const { code, newPassword } = req.body;

  db.query('SELECT * FROM users WHERE reset_code = ?', [code], async (err, results) => {
    if (err) return res.status(500).send('Server error');
    if (results.length === 0) return res.status(400).send('Invalid reset code');

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.query('UPDATE users SET password = ?, reset_code = NULL WHERE reset_code = ?', [hashedPassword, code], (err) => {
        if (err) return res.status(500).send('Reset failed');
        res.send('Password reset successfully');
      });
    } catch {
      res.status(500).send('Hashing failed');
    }
  });
};
