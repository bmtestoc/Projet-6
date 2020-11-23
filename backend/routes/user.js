const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user');
const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    max: 2
  });

// Routes de l'API
router.post('/signup', userCtrl.signup);
router.post('/login', apiLimiter, userCtrl.login);

module.exports = router;