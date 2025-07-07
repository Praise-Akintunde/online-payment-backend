const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// MySQL connection
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'jupiter_db'
});

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'jupiter.app.noreply1@gmail.com',
    pass: 'spaqmprpuobliymj'
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Static routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/forgot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot.html'));
});

app.get('/reset', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset.html'));
});

// Optional redirect if someone hits /forgot.html by mistake
app.get('/forgot.html', (req, res) => {
  res.redirect('/forgot');
});

// Signup logic
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).send('Server error');
    if (results.length > 0) return res.status(400).send('User already exists');

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        (err, result) => {
          if (err) return res.status(500).send('Server error');
          res.status(200).send('Signup successful');
        }
      );
    } catch (hashErr) {
      console.error('Hash error:', hashErr);
      res.status(500).send('Error hashing password');
    }
  });
});

// Login logic
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).send('Server error');
    if (results.length === 0) return res.status(401).send('Invalid credentials');

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).send('Invalid credentials');

    res.status(200).send('Login successful');
  });
});

// Forgot password logic
app.post('/forgot', (req, res) => {
  const { email } = req.body;
  const code = crypto.randomBytes(3).toString('hex');

  const updateQuery = 'UPDATE users SET reset_code = ? WHERE email = ?';
  db.query(updateQuery, [code, email], (err, result) => {
    if (err) {
      console.error('DB Update Error:', err); // Add this
      return res.status(500).send('Server error');
    }

    if (result.affectedRows === 0) {
      console.log('Email not found:', email); // Add this
      return res.status(404).send('Email not found');
    }

    console.log(`🔐 Reset code for ${email}: ${code}`);

    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'jupiter.app.noreply1@gmail.com',
        pass: 'spaqmprpuobliymj'
      }
    });

    const mailOptions = {
      from: 'jupiter.app.noreply1@gmail.com',
      to: email,
      subject: 'Your Jupiter Reset Code',
      text: `Your reset code is: ${code}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Mail Error:', error); // Add this
        return res.status(500).send('Error sending email');
      }
      console.log('Email sent:', info.response);
      res.send('Reset code sent to your email');
    });
  });
});


// Reset password logic
app.post('/reset', async (req, res) => {
  const { code, newPassword } = req.body;

  db.query('SELECT * FROM users WHERE reset_code = ?', [code], async (err, results) => {
    if (err) return res.status(500).send('Server error');
    if (results.length === 0) return res.status(400).send('Invalid code');

    const email = results[0].email;

    try {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      db.query('UPDATE users SET password = ?, reset_code = NULL WHERE email = ?', [hashedNewPassword, email], (err, result) => {
        if (err) return res.status(500).send('Could not reset password');
        res.status(200).send('Password reset successfully');
      });
    } catch (err) {
      console.error('Hash error:', err);
      res.status(500).send('Error resetting password');
    }
  });
});

// Home page
app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Jupiter server running on http://localhost:${PORT}`);
});
