const express = require('express');
const authenticateToken = require('../../middlewares/auth');
const db = require('../../config/db');
const router = express.Router();

router.post('/', authenticateToken, (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];

  db.query('DELETE FROM tokens WHERE token = ?', [token], (err) => {
    if (err) return res.status(500).json({ message: 'Logout error' });
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
