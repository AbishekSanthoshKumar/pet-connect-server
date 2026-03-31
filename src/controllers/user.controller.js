const service = require('../services/user.service');

exports.register = async (req, res) => {
  try {
    const result = await service.registerUser(req.body);
    res.json(result);
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.login = async (req, res) => {
  try {
    const result = await service.loginUser(req.body);
    res.json(result);
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const result = await service.getUserById(req.params.id);
    res.json(result);
  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};