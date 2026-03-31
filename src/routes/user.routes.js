const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/register', authMiddleware, controller.register);
router.post('/login', authMiddleware, controller.login);
router.get('/profile/:id', authMiddleware, controller.getProfile);

module.exports = router;