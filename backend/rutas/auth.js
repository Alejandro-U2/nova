const express = require('express');
const router = express.Router();
const { googleAuth, facebookAuth } = require('../controllers/auth');

router.post('/google', googleAuth);
router.post('/facebook', facebookAuth);

module.exports = router;
