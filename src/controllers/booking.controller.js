const service = require('../services/booking.service');
const pool = require('../config/db');

exports.createBooking = async (req, res) => {
  try {
    let { id } = req.decoded
    const data = await service.createBooking(req.body, id);
    res.json(data);
  } catch (err) {
    console.error("Create Booking Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getBookings = async (req, res) => {
  try {
    let { id } = req.decoded
    const data = await service.getBookings(id);
    res.json(data);
  } catch (err) {
    console.error("Get Bookings Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const data = await service.getBookingById(req.params.id);
    res.json(data);
  } catch (err) {
    console.error("Get Booking Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const data = await service.updateBooking(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    console.error("Update Booking Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



// Get bookings for a provider (Vet or Caretaker)

exports.getProviderBookings = async (req, res) => {

  try {

    const { providerId } = req.params;
    const result = await pool.query(
      `SELECT b.*, u.name as owner_name, u.phone as owner_phone, u.profile_image as owner_image,
      p.name as pet_name, p.type, p.breed,
      b.booking_date as date, TO_CHAR(b.booking_date, 'HH:mm AM') as time
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN pets p ON b.pet_id = p.id
      JOIN providers pro ON pro.id = b.provider_id
      WHERE pro.user_id = $1
      ORDER BY b.booking_date DESC`,
      [providerId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get provider bookings error:", error);
    res.status(500).json({ error: error.message });
  }

};

// Update booking status (Accept/Reject/Payment)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, payment_status } = req.body;

    let query = "UPDATE bookings SET ";
    const values = [];
    const sets = [];

    if (status) {
      if (!['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status.toUpperCase())) {
        return res.status(400).json({ message: "Invalid status" });
      }
      values.push(status.toUpperCase());
      sets.push(`status = $${values.length}`);
    }

    if (payment_status) {
      if (!['PENDING', 'PAID', 'REFUNDED'].includes(payment_status.toUpperCase())) {
        return res.status(400).json({ message: "Invalid payment status" });
      }
      values.push(payment_status.toUpperCase());
      sets.push(`payment_status = $${values.length}`);
    }

    if (sets.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(bookingId);
    query += sets.join(", ") + ` WHERE id = $${values.length} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const booking = result.rows[0];

    // // Trust Score logic (if status changed)
    // if (status) {
    //     const upperStatus = status.toUpperCase();
    //     if (upperStatus === 'COMPLETED') {
    //         await pool.query(
    //             "UPDATE booking_profiles SET trust_score = LEAST(100, trust_score + 5) WHERE user_id = $1",
    //             [booking.provider_id]
    //         );
    //     } else if (upperStatus === 'REJECTED') {
    //         await pool.query(
    //             "UPDATE booking_profiles SET trust_score = GREATEST(0, trust_score - 5) WHERE user_id = $1",
    //             [booking.provider_id]
    //         );
    //     }
    // }

    // // Earnings logic (if payment_status changed to PAID)
    // if (payment_status && payment_status.toUpperCase() === 'PAID') {
    //     const fee = booking.service_fee || 0;
    //     await pool.query(
    //         "UPDATE booking_profiles SET total_earned = total_earned + $1 WHERE user_id = $2",
    //         [fee, booking.provider_id]
    //     );
    // }

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: booking
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({ error: error.message });
  }
};