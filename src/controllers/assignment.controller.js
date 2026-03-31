const pool = require("../config/db");

/* ================= ASSIGN PET ================= */
exports.assignPet = async (req, res) => {
  try {
    // Only OWNER can assign
    if (req.decoded.role !== "OWNER") {
      return res.status(403).json({ message: "Only owners can assign pets" });
    }
    const { pet_id, assigned_user_id, service_fee } = req.body;
    if (!pet_id || !assigned_user_id) {
      return res.status(400).json({
        message: "pet_id and assigned_user_id are required"
      });
    }

    // 1. Check pet belongs to this owner
    const petCheck = await pool.query(
      "SELECT pet_id FROM pets WHERE pet_id = $1 AND owner_id = $2",
      [pet_id, req.decoded.id]
    );

    if (petCheck.rows.length === 0) {
      return res.status(403).json({
        message: "You do not own this pet"
      });
    }

    // 2. Check assigned user exists and is VET or CARETAKER
    const userCheck = await pool.query(
      "SELECT id, role FROM users WHERE id = $1 AND role IN ('VET', 'CARETAKER')",
      [assigned_user_id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Assigned user not found or invalid role"
      });
    }

    const assignedRole = userCheck.rows[0].role;

    // ✅ 3. Prevent duplicate active assignment
    const duplicateCheck = await pool.query(
      `SELECT 1 FROM pet_assignments
       WHERE pet_id = $1
       AND assigned_user_id = $2
       AND status != 'COMPLETED'`,
      [pet_id, assigned_user_id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({
        message: "This pet is already assigned to this user"
      });
    }

    // 4. Create assignment
    const assignment = await pool.query(
      `INSERT INTO pet_assignments
      (pet_id, assigned_user_id, role, service_fee)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [pet_id, assigned_user_id, assignedRole, service_fee || 0]
    );
    return res.status(201).json({
      message: "Pet assigned successfully",
      assignment: assignment.rows[0]
    });

  } catch (error) {
    console.error("Assign pet error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET BOOKINGS BY USER (OWNER) ================= */
exports.getBookingsByOwner = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT 
         pa.assignment_id,
         pa.status,
         pa.payment_status,
         pa.service_fee,
         pa.role,
         p.pet_id,
         p.name AS pet_name,
         p.species,
         u.name AS provider_name
       FROM pet_assignments pa
       JOIN pets p ON p.pet_id = pa.pet_id
       JOIN users u ON u.id = pa.assigned_user_id
       WHERE p.owner_id = $1
       ORDER BY pa.created_at DESC`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Get owner bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET CARETAKER BOOKINGS ================= */
exports.getCaretakerBookings = async (req, res) => {
  try {
    const { caretakerId } = req.params;
    const result = await pool.query(
      `SELECT 
         pa.assignment_id,
         pa.status,
         pa.payment_status,
         pa.service_fee,
         p.name AS pet_name,
         p.species,
         u.name AS owner_name
       FROM pet_assignments pa
       JOIN pets p ON p.pet_id = pa.pet_id
       JOIN users u ON u.id = p.owner_id
       WHERE pa.assigned_user_id = $1 AND pa.role = 'CARETAKER'
       ORDER BY pa.created_at DESC`,
      [caretakerId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE BOOKING (STATUS / PAYMENT) ================= */
exports.updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, paymentStatus } = req.body;

    let query = "UPDATE pet_assignments SET ";
    const values = [];
    const sets = [];

    if (status) {
      values.push(status.toUpperCase());
      sets.push(`status = $${values.length}`);
    }
    if (paymentStatus) {
      values.push(paymentStatus.toUpperCase());
      sets.push(`payment_status = $${values.length}`);
    }

    if (sets.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    values.push(bookingId);
    query += sets.join(", ") + ` WHERE assignment_id = $${values.length} RETURNING *`;

    const updated = await pool.query(query, values);
    
    if (updated.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

//Accept assignment
exports.acceptAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    // Only VET or CARETAKER can accept
    if (req.decoded.role !== "VET" && req.decoded.role !== "CARETAKER") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check assignment exists, belongs to user, and is ASSIGNED
    const assignmentResult = await pool.query(
      `SELECT * FROM pet_assignments
       WHERE assignment_id = $1
       AND assigned_user_id = $2
       AND status = 'ASSIGNED'`,
      [assignment_id, req.decoded.id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(400).json({
        message: "Assignment cannot be accepted"
      });
    }
    // Check if already paid
    const existing = await pool.query(
      "SELECT payment_status FROM pet_assignments WHERE assignment_id = $1",
      [req.params.id]
    );

    if (existing.rows[0].payment_status === "PAID") {
      return res.status(400).json({
        message: "Cannot modify assignment after payment"
      });
    }
    // Update status to ACCEPTED
    const updated = await pool.query(
      `UPDATE pet_assignments
       SET status = 'ACCEPTED'
       WHERE assignment_id = $1
       RETURNING *`,
      [assignment_id]
    );

    return res.status(200).json({
      message: "Assignment accepted",
      assignment: updated.rows[0]
    });

  } catch (error) {
    console.error("Accept assignment error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//Complete assignment
exports.completeAssignment = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    // Only VET or CARETAKER can complete
    if (req.decoded.role !== "VET" && req.decoded.role !== "CARETAKER") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check assignment exists, belongs to user, and is ACCEPTED
    const assignmentResult = await pool.query(
      `SELECT * FROM pet_assignments
       WHERE assignment_id = $1
       AND assigned_user_id = $2
       AND status = 'ACCEPTED'`,
      [assignment_id, req.decoded.id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(400).json({
        message: "Assignment cannot be completed"
      });
    }
    // Check if already paid
    const existing = await pool.query(
      "SELECT payment_status FROM pet_assignments WHERE assignment_id = $1",
      [req.params.id]
    );

    if (existing.rows[0].payment_status === "PAID") {
      return res.status(400).json({
        message: "Cannot modify assignment after payment"
      });
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Update status to COMPLETED
      const updated = await client.query(
        `UPDATE pet_assignments
         SET status = 'COMPLETED'
         WHERE assignment_id = $1
         RETURNING *`,
        [assignment_id]
      );

      // 2. Increment Trust Score (+5, cap at 100)
      await client.query(
        `UPDATE booking_profiles 
         SET trust_score = LEAST(100, trust_score + 5)
         WHERE user_id = $1`,
        [req.decoded.id]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        message: "Assignment completed and trust score increased",
        assignment: updated.rows[0]
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Complete assignment error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.markAsPaid = async (req, res) => {
  try {
    const { assignment_id } = req.params;

    // Only OWNER can mark payment
    if (req.decoded.role !== "OWNER") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check assignment belongs to owner's pet and is COMPLETED + PENDING
    const check = await pool.query(
      `SELECT pa.assignment_id
       FROM pet_assignments pa
       JOIN pets p ON p.pet_id = pa.pet_id
       WHERE pa.assignment_id = $1
       AND p.owner_id = $2
       AND pa.status = 'COMPLETED'
       AND pa.payment_status = 'PENDING'`,
      [assignment_id, req.decoded.id]
    );

    if (check.rows.length === 0) {
      return res.status(400).json({
        message: "Payment cannot be processed"
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 1. Update payment status
      const updated = await client.query(
        `UPDATE pet_assignments
         SET payment_status = 'PAID'
         WHERE assignment_id = $1
         RETURNING *`,
        [assignment_id]
      );

      const assignment = updated.rows[0];

      // 2. Update provider's total_earned
      await client.query(
        `UPDATE booking_profiles 
         SET total_earned = total_earned + $1
         WHERE user_id = $2`,
        [assignment.service_fee, assignment.assigned_user_id]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        message: "Payment marked as PAID and earnings updated",
        assignment: assignment
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Mark payment error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getCaretakerEmergencyBookings = async (req, res) => {
  try {
    const { caretakerId } = req.params;
    // For now, we'll assume status = 'EMERGENCY' exists or similar. 
    // If not, we return empty list to prevent frontend crash.
    const result = await pool.query(
      `SELECT pa.*, p.name as pet_name 
       FROM pet_assignments pa
       JOIN pets p ON pa.pet_id = p.pet_id
       WHERE pa.assigned_user_id = $1 AND pa.status = 'EMERGENCY'`,
      [caretakerId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyEarnings = async (req, res) => {
  try {
    if (!["VET", "CARETAKER"].includes(req.decoded.role)) {
      return res.status(403).json({
        message: "Only service providers can view earnings"
      });
    }

    // Get summary
    const summary = await pool.query(
      `SELECT 
         COUNT(*) AS total_jobs,
         COALESCE(SUM(service_fee), 0) AS total_earned
       FROM pet_assignments
       WHERE assigned_user_id = $1
       AND status = 'COMPLETED'
       AND payment_status = 'PAID'`,
      [req.decoded.id]
    );

    // Get detailed history
    const history = await pool.query(
      `SELECT assignment_id, pet_id, service_fee, created_at
       FROM pet_assignments
       WHERE assigned_user_id = $1
       AND status = 'COMPLETED'
       AND payment_status = 'PAID'
       ORDER BY created_at DESC`,
      [req.decoded.id]
    );

    res.status(200).json({
      message: "Earnings fetched successfully",
      summary: summary.rows[0],
      history: history.rows
    });

  } catch (error) {
    console.error("Earnings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
