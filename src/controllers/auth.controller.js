const service = require('../services/auth.service');

exports.register = async (req, res) => {
  try {
    const data = await service.register(req.body);
    console.log("data", data);
    
    res.json(data);
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const data = await service.login(req.body);

    console.log("data", data);

    res.json(data);
  } catch (err) {
    console.error("Login Error:", err);
    res.status(401).json({ error: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};