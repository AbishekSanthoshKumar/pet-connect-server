const db = require('../config/db');

exports.registerUser = async ({ name, email, password, role }) => {
  const query = `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
    RETURNING *`;
    
  const values = [name, email, password, role];
  const result = await db.query(query, values);
  return result.rows[0];
};

exports.loginUser = async ({ email, password }) => {
  const result = await db.query(
    `SELECT * FROM users WHERE email = $1 AND password = $2`,
    [email, password]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid credentials");
  }

  return result.rows[0];
};

exports.getUserById = async (id) => {
  const result = await db.query(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};