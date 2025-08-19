require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Page Routes
app.use('/', require('./routes/pages/landing'));
const homeRoutes = require('./routes/pages/home');
app.use('/', homeRoutes);

// Auth Routes
app.use('/signup', require('./routes/auth/signup'));
app.use('/login', require('./routes/auth/login'));
app.use('/logout', require('./routes/auth/logout'));
app.use('/forgot', require('./routes/auth/forgot'));
app.use('/reset', require('./routes/auth/reset'));
app.use('/profile', require('./routes/auth/profile'));
// User Routes
app.use('/user/profile', require('./routes/auth/profile'));

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Jupiter server running at http://localhost:${PORT}`);
});
