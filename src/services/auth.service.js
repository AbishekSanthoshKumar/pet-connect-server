const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async ({ name, email, password, role, specialist, experience }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await db.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name, email, hashedPassword, role]
  );

  const user = result.rows[0];

  await db.query(
    `INSERT INTO providers (user_id, type, specialization, experience)
     VALUES ($1, $2, $3, $4)`,
    [user.id, role, specialist, experience]
  );

  const access_token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: '365d'
  });

  return { ...user, access_token, };
};

exports.login = async ({ email, password }) => {
  const result = await db.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = result.rows[0];

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  const access_token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '365d' }
  );

  return {
    ...{
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    access_token,
  };
};