const express = require('express');
const router = express.Router();
const controller = require('../controllers/visit.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, controller.createVisit);
router.get('/', authMiddleware, controller.getVisits);

module.exports = router;