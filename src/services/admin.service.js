const db = require('../config/db');

exports.getAllUsers = async () => {
  const result = await db.query(`SELECT * FROM users`);
  return result.rows;
};

exports.getAllBookings = async () => {
  const result = await db.query(`SELECT * FROM bookings`);
  return result.rows;
};