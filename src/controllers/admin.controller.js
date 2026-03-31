const service = require('../services/admin.service');

exports.getAllUsers = async (req, res) => {
  try {
    const data = await service.getAllUsers();
    res.json(data);
  } catch (err) {
    console.error("Admin Users Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const data = await service.getAllBookings();
    res.json(data);
  } catch (err) {
    console.error("Admin Bookings Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};