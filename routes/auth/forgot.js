const express = require('express');
const crypto = require('crypto');
const db = require('../../config/db');
const transporter = require('../../config/mailer');
const router = express.Router();

router.post('/', (req, res) => {
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

module.exports = router;
