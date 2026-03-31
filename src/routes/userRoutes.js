const express = require("express");
const router = express.Router();

// import controller functions
const { registerUser, loginUser } = require("../controllers/userController");

// AUTH ROUTES
router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;