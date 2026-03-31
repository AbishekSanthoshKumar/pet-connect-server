const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');

router.get('/users', authMiddleware, controller.getAllUsers);
router.get('/bookings', authMiddleware, controller.getAllBookings);

module.exports = router;