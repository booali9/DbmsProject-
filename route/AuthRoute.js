const express = require("express");
const { loginUser,forgotPassword,resetPassword,resendOTP } = require("../controllers/authcontroller");

const router = express.Router();

// Login a user
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword );
router.post("/resetpassword", resetPassword );
router.post("/resendotp", resendOTP );

module.exports = router;