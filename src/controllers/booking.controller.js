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

