const express = require("express");
const router = express.Router();
const authController = require("../controllers/Authcontroller");


// Auth routes
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword);
router.post("/send-otp", authController.sendOTP); // Send OTP
router.post("/resend-otp", authController.resendOTP); // Resend OTP
router.post("/reset-password", authController.resetPassword); // Reset pa

module.exports = router;