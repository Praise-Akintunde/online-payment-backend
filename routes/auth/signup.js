const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../../config/db');
const router = express.Router();

router.post('/', async (req, res) => {
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

module.exports = router;
