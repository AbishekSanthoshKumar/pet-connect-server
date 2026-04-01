const express = require('express');
const router = express.Router();
const controller = require('../controllers/booking.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, controller.createBooking);
router.get('/', authMiddleware, controller.getBookings);
router.get('/:id', authMiddleware, controller.getBookingById);
router.put('/:id', authMiddleware, controller.updateBooking);
router.get("/provider/:providerId", authMiddleware, controller.getProviderBookings);
router.patch("/:bookingId/status", authMiddleware, controller.updateBookingStatus);

module.exports = router;