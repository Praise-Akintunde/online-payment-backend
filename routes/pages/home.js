const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/homeloader', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/homeloader.html'));
});

module.exports = router;
