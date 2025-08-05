const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../config/db');
const router = express.Router();
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET;

// Serve login.html on GET /login
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/login.html'));
});

router.post('/', (req, res) => {
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
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    });
  });
});

module.exports = router;
