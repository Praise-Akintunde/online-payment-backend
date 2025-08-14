const express = require('express');
const db = require('../../config/db');
const authenticateToken = require('../../middlewares/auth');
const router = express.Router();

router.get('/', (req, res) => {
  res.redirect('http://localhost:3000/profile.html');
});

// Get logged-in user's profile
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT username, email, profile_picture, created_at
    FROM users
    WHERE id = ?
    LIMIT 1
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(results[0]);
  });
});

module.exports = router;
