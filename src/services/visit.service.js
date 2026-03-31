const db = require('../config/db');

exports.createVisit = async ({ booking_id, visit_time, notes }) => {
  const result = await db.query(
    `INSERT INTO visits (booking_id, visit_time, notes)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [booking_id, visit_time, notes]
  );
  return result.rows[0];
};

exports.getVisits = async (id) => {
  const result = await db.query(`
    SELECT v.* 
    FROM visits as v
    LEFT JOIN bookings as b ON b.id = v.booking_id
    WHERE b.user_id = $1;
  `, [id]);
  return result.rows;
};