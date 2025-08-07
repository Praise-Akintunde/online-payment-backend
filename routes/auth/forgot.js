const express = require('express');
const router = express.Router();
const path = require('path');
const auth = require('../../controllers/AuthController');

// GET /forgot - render the forgot password page
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/forgot.html'));
});

// POST /forgot - handle reset code generation
router.post('/', auth.forgot);

module.exports = router;
