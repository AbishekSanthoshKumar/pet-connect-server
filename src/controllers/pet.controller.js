const service = require('../services/pet.service');

exports.createPet = async (req, res) => {
  try {
    let { id } = req.decoded
    const data = await service.createPet(req.body, id);
    res.json(data);
  } catch (err) {
    console.error("Create Pet Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getPets = async (req, res) => {
  try {
    let { id } = req.decoded
    const data = await service.getPets(id);
    res.json(data);
  } catch (err) {
    console.error("Get Pets Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getPetById = async (req, res) => {
  try {
    const data = await service.getPetById(req.params.id);
    res.json(data);
  } catch (err) {
    console.error("Get Pet Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.updatePet = async (req, res) => {
  try {
    const data = await service.updatePet(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    console.error("Update Pet Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.deletePet = async (req, res) => {
  try {
    await service.deletePet(req.params.id);
    res.json({ message: "Pet deleted successfully" });
  } catch (err) {
    console.error("Delete Pet Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};