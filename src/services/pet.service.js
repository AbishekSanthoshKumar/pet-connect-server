const db = require('../config/db');

exports.createPet = async ({ owner_id, name, type, breed, age }, id) => {
  const result = await db.query(
    `INSERT INTO pets (owner_id, name, type, breed, age)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [owner_id ?? id, name, type, breed, age]
  );
  return result.rows[0];
};

exports.getPets = async (user_id) => {
  const result = await db.query(`SELECT * FROM pets WHERE owner_id = $1`, [user_id]);
  return result.rows;
};

exports.getPetById = async (id) => {
  const result = await db.query(`SELECT * FROM pets WHERE id = $1`, [id]);
  return result.rows[0];
};

exports.updatePet = async (id, { name, type, breed, age }) => {
  const result = await db.query(
    `UPDATE pets
     SET name=$1, type=$2, breed=$3, age=$4
     WHERE id=$5
     RETURNING *`,
    [name, type, breed, age, id]
  );
  return result.rows[0];
};

exports.deletePet = async (id) => {
  await db.query(`DELETE FROM pets WHERE id = $1`, [id]);
};