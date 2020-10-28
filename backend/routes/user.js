const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/user');
const bouncer = require('express-bouncer')(5000, 10000, 2);

// Routes de l'API
router.post('/signup', userCtrl.signup);
router.post('/login', bouncer.block, userCtrl.login);

module.exports = router;