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
