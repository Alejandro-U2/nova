const express = require('express');
const router = express.Router();
const authMiddle = require('../middlewares/auth');

router.get('/', (req, res) => {
  try {
    return res.json({ socialProviders: authMiddle.socialProviders });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to read config' });
  }
});

module.exports = router;
