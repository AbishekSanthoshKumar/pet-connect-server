const express = require('express');
const router = express.Router();
const controller = require('../controllers/provider.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, controller.createProvider);
router.get('/', authMiddleware, controller.getProviders);
router.get('/:id', authMiddleware, controller.getProviderById);
router.get("/dashboard/:vetId", authMiddleware, controller.getVetDashboard);
router.get("/caretaker/:caretakerId", authMiddleware, controller.getCaretakerDashboard);



module.exports = router;