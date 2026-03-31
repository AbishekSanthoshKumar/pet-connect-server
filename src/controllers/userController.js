const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

/* ================= REGISTER ================= */
exports.registerUser = async (req, res) => {
  const client = await pool.connect();
  try {
    let { name, email, password, role, phone, username, license, specialist, experience } = req.body;
    role = role.toUpperCase();
    
    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    if (!username) {
      username = email.split('@')[0] + "_" + Math.floor(Math.random() * 1000);
    }

    // 1. Check uniqueness
    const checkUser = await pool.query("SELECT id FROM users WHERE email = $1 OR username = $2", [email, username]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ message: "Email or username already registered" });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await client.query("BEGIN");

    // 3. Insert User
    const userRes = await client.query(
      `INSERT INTO users (name, email, password, role, phone, username, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, username, is_verified`,
      [name, email, hashedPassword, role, phone, username, (role === "ADMIN" || role === "OWNER")]
    );
    
    const userId = userRes.rows[0].id;

    // 4. Insert Booking Profile (if applicable)
    if (role === "VET" || role === "CARETAKER") {
      await client.query(
        `INSERT INTO booking_profiles (user_id, user_role, experience, specialization, license) 
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, role, experience || null, specialist || null, license || null]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "User registered successfully",
      user: userRes.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/* ================= LOGIN ================= */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT u.*, bp.experience, bp.specialization, bp.license, bp.trust_score, bp.emergency_available, bp.bio, bp.base_rate
       FROM users u
       LEFT JOIN booking_profiles bp ON u.id = bp.user_id
       WHERE u.email = $1 OR u.username = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ message: "Account suspended" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });

    delete user.password; // Don't send password
    res.status(200).json({
      message: "Login successful",
      token,
      user
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= UPDATE PROFILE ================= */
exports.updateProfile = async (req, res) => {
  const client = await pool.connect();
  try {
    const { userId } = req.params;
    const { name, phone, profile_image, experience, specialist, license, emergency_available } = req.body;

    await client.query("BEGIN");

    // Update User
    await client.query(
      `UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), profile_image = COALESCE($3, profile_image)
       WHERE id = $4`,
      [name, phone, profile_image, userId]
    );

    // Update Booking Profile (if exists)
    if (req.user.role === "VET" || req.user.role === "CARETAKER") {
      const { experience, specialist, license, emergency_available, bio, base_rate } = req.body;
      await client.query(
        `UPDATE booking_profiles SET 
          experience = COALESCE($1, experience), 
          specialization = COALESCE($2, specialization), 
          license = COALESCE($3, license),
          emergency_available = COALESCE($4, emergency_available),
          bio = COALESCE($5, bio),
          base_rate = COALESCE($6, base_rate)
         WHERE user_id = $7`,
        [experience, specialist, license, emergency_available, bio, base_rate, userId]
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};