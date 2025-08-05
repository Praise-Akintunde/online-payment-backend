const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

router.get('/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query('SELECT username, email, image, cards FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json(results[0]);
  });
});

module.exports = router;
