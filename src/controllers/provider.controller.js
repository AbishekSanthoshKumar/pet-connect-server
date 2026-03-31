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


    // Earnings History (Monthly)

    const earnings = await service.getVetEarnings()


    res.status(200).json({

      ...dashboard.rows[0],

      earningsHistory: earnings.rows

    });

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

    res.status(200).json({
      ...dashboard.rows[0],
      earningsHistory: earnings.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};