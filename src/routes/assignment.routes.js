const express = require("express");
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const {
  assignPet,
  getBookingsByOwner,
  getCaretakerBookings,
  getCaretakerEmergencyBookings,
  updateBooking,
  getMyEarnings,
  acceptAssignment,
  completeAssignment
} = require("../controllers/assignment.controller");

// Basic CRUD (Mounted at /bookings)
router.post("/", authMiddleware, assignPet); // Create booking
router.get("/:userId", authMiddleware, getBookingsByOwner); // Get owner's bookings
router.put("/:bookingId", authMiddleware, updateBooking); // Update status/payment

// Caretaker specific
router.get("/caretaker/:caretakerId", authMiddleware, getCaretakerBookings);
router.get("/caretaker/:caretakerId/emergency", authMiddleware, getCaretakerEmergencyBookings);

// Provider specific actions
router.get("/my", authMiddleware, getCaretakerBookings); // Fallback for 'my' bookings
router.patch("/accept/:assignment_id", authMiddleware, acceptAssignment);
router.patch("/complete/:assignment_id", authMiddleware, completeAssignment);
router.get("/earnings", authMiddleware, getMyEarnings);

module.exports = router;