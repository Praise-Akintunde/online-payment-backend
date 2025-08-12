const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/homeloader', (req, res) => {
  res.sendFile(path.join(__dirname, 'http://localhost:3000/homeloader.html'));
});

module.exports = router;
