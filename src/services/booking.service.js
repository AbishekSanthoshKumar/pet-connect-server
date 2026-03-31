const db = require('../config/db');

function convertTo24Hour(timeStr) {
  // If already in HH:mm:ss → return as is
  if (timeStr.includes(':') && !timeStr.toLowerCase().includes('am') && !timeStr.toLowerCase().includes('pm')) {
    return timeStr;
  }

  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');

  hours = parseInt(hours);

  if (modifier.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (modifier.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}

exports.createBooking = async ({ user_id, provider_id, pet_id, booking_date, booking_time, status }, id) => {
  const formattedTime = convertTo24Hour(booking_time);

  console.log("booking_time", booking_time, formattedTime);

  const result = await db.query(
    `INSERT INTO bookings (user_id, provider_id, pet_id, booking_date, status)
     VALUES ($1, $2, $3, ($4::date + $6::time), $5)
     RETURNING *`,
    [user_id ?? id, provider_id, pet_id, booking_date, status, formattedTime]
  );
  return result.rows[0];
};

exports.getBookings = async (user_id) => {
  const result = await db.query(`
    SELECT b.*, b.id as booking_id, TO_CHAR(b.booking_date, 'Mon DD, YYYY') as date, TO_CHAR(b.booking_date, 'HH:mm AM') as time,
    pu.name as provider_name, pu.role as type, p.specialization,
    pet.name as pet_name,
    'Bengaluru' as address
    FROM bookings as b 
    LEFT JOIN users as u ON u.id = b.user_id
    LEFT JOIN providers as p ON p.id = b.provider_id
    LEFT JOIN users as pu ON pu.id = p.user_id
    LEFT JOIN pets as pet ON pet.id = b.pet_id
    where b.user_id = $1;
  `, [user_id]);
  return result.rows;
};

exports.getBookingById = async (id) => {
  const result = await db.query(`SELECT * FROM bookings WHERE id = $1`, [id]);
  return result.rows[0];
};

exports.updateBooking = async (id, { status }) => {
  const result = await db.query(
    `UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0];
};