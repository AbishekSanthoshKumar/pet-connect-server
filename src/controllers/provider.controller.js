const service = require('../services/provider.service');
const pool = require('../config/db');

exports.createProvider = async (req, res) => {
  try {
    const data = await service.createProvider(req.body);
    res.json(data);
  } catch (err) {
    console.error("Create Provider Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProviders = async (req, res) => {
  try {
    let role = req.query.type ?? "vet"
    console.log("role", role);
    const data = await service.getProviders(role);
    res.json(data);
  } catch (err) {
    console.error("Get Providers Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProviderById = async (req, res) => {
  try {
    const data = await service.getProviderById(req.params.id);
    res.json(data);
  } catch (err) {
    console.error("Get Provider By ID Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getVetDashboard = async (req, res) => {

  try {

    const { vetId } = req.params;

    // Stats: Total appointments, pending, completed

    const dashboard = await service.getVetDashboard(vetId);

    const availability = await service.getAvailability(vetId);

    // Earnings History (Monthly)

    const earnings = await service.getVetEarnings()

    let json = {
      ...dashboard.rows[0],
      earningsHistory: earnings.rows,
      availability: availability.rows.length > 0
        ? availability.rows[0]
        : null,
    }

    console.log("json", json)

    res.status(200).json(json);

  } catch (error) {

    console.log("error", error);

    res.status(500).json({ error: error.message });

  }

};

/* ================= CARETAKER DASHBOARD ================= */
exports.getCaretakerDashboard = async (req, res) => {
  try {
    const { caretakerId } = req.params;

    const dashboard = await pool.query(
      `SELECT 
         (SELECT COUNT(*) FROM bookings WHERE provider_id = $1) as total_bookings,
         (SELECT COUNT(*) FROM bookings WHERE provider_id = $1 AND status = 'COMPLETED') as completed_tasks`,
      [caretakerId]
    );

    // Earnings History (Monthly)
    const earnings = await pool.query(
      `SELECT TO_CHAR(created_at, 'Mon') as month, SUM(service_fee) as amount, COUNT(*) as jobs
       FROM pet_assignments
       WHERE assigned_user_id = $1 AND status = 'COMPLETED' AND payment_status = 'PAID'
       GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
       ORDER BY DATE_TRUNC('month', created_at) DESC`,
      [caretakerId]
    );

    const availability = await service.getAvailability(caretakerId);

    res.status(200).json({
      ...dashboard.rows[0],
      earningsHistory: earnings.rows,
      availability: availability.rows.length > 0
        ? availability.rows[0]
        : null,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// setAvailability
exports.setAvailability = async (req, res) => {
  try {

    let { id } = req.decoded

    let { startTime, endTime } = req.body

    console.log("startTime, endTime", startTime, endTime);

    // startTime, endTime 9:00 AM 5:00 PM

    await service.saveAvailability(startTime, endTime, id)

    return res.status(200).json({
      message: "Availability set successfully",
    })

  } catch (error) {
    console.log("error", error);

    return res.status(500).json({
      message: "Something went wrong",
      error: error,
    })
  }
}