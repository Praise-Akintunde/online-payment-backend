const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../../config/db');
const router = express.Router();
const path = require('path');

router.post('/', async (req, res) => {
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

module.exports = router;
