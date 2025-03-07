const express = require("express");
const { loginUser,forgotPassword,resetPassword } = require("../controllers/authcontroller");

const router = express.Router();

// Login a user
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword );
router.post("/resetpassword", resetPassword );

module.exports = router;