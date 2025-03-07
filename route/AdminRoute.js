const express = require("express");
const { registerUser } = require("../controllers/admincontroller");
const { isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Register a new user
router.post("/register", registerUser);

module.exports = router;