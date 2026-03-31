const db = require('../config/db');

exports.createAssignment = async ({ provider_id, booking_id }) => {
  const result = await db.query(
    `INSERT INTO assignments (provider_id, booking_id)
     VALUES ($1, $2)
     RETURNING *`,
    [provider_id, booking_id]
  );
  return result.rows[0];
};

exports.getAssignments = async (id) => {
  const result = await db.query(`
    SELECT a.* 
    FROM assignments as a
    LEFT JOIN providers as p ON p.id = a.provider_id
    WHERE p.user_id = $1;
  `, [id]);
  return result.rows;
};