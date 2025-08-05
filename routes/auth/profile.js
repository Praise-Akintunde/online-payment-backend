const express = require('express');
const db = require('../../config/db');
const authenticateToken = require('../../middlewares/auth');
const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query('SELECT username, email, image, cards FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Database error' });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    res.json(results[0]);
  });
});

module.exports = router;
