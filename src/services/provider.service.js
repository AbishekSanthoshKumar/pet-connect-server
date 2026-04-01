const db = require('../config/db');

exports.createProvider = async ({ user_id, type, specialization, experience }) => {
  const query = `
    INSERT INTO providers (user_id, type, specialization, experience)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;

  const values = [user_id, type, specialization, experience];
  const result = await db.query(query, values);
  return result.rows[0];
};

exports.getProviders = async (role) => {
  const result = await db.query(`
    SELECT p.*, TRUE AS "emergencyAvailable", u.name
    FROM providers as p 
    LEFT JOIN users u ON p.user_id = u.id
    WHERE p.type = $1
    `, [role]);
  return result.rows;
};

exports.getProviderById = async (id) => {
  const result = await db.query(
    `SELECT * FROM providers WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

exports.getVetDashboard = async (vetId) => {
  const result = await db.query(
    `SELECT 
      (SELECT COUNT(*) FROM bookings WHERE provider_id = $1) as total_bookings,
      (SELECT COUNT(*) FROM bookings WHERE provider_id = $1 AND status = 'PENDING') as pending_bookings,
      (SELECT COUNT(*) FROM bookings WHERE provider_id = $1 AND status = 'COMPLETED') as completed_bookings`,

    [vetId]
  );
  return result;
};

exports.getVetEarnings = async (vetId) => {
  const earnings = await db.query(


    `SELECT TO_CHAR(created_at, 'Mon') as month, SUM(service_fee) as amount, COUNT(*) as jobs
      FROM pet_assignments
      WHERE assigned_user_id = $1 AND status = 'COMPLETED' AND payment_status = 'PAID'
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) DESC`,
    [vetId]
  );

  return earnings;



};