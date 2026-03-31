const service = require('../services/visit.service');

exports.createVisit = async (req, res) => {
  try {
    const data = await service.createVisit(req.body);
    res.json(data);
  } catch (err) {
    console.error("Create Visit Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getVisits = async (req, res) => {
  try {
    
    let { id } = req.decoded

    const data = await service.getVisits(id);
    res.json(data);
  } catch (err) {
    console.error("Get Visits Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};