const express = require('express');
const router = express.Router();
const controller = require('../controllers/pet.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, controller.createPet);
router.get('/', authMiddleware, controller.getPets);
router.get('/:id', authMiddleware, controller.getPetById);
router.put('/:id', authMiddleware, controller.updatePet);
router.delete('/:id', authMiddleware, controller.deletePet);

module.exports = router;