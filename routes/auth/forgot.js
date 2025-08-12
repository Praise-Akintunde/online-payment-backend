const express = require('express');
const router = express.Router();
const path = require('path');
const auth = require('../../controllers/AuthController');
const crypto = require('crypto');

router.get('/', (req, res) => {
  res.redirect('http://localhost:3000/forgot.html');
});

// POST /forgot - handle reset code generation
router.post('/', auth.forgot);

module.exports = router;
