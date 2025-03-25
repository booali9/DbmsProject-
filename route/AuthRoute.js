const express = require("express");
const { loginSuperAdmin,
    loginUndergrad,
    loginPostgrad,loginOther,forgotPassword,resetPassword,resendOTP } = require("../controllers/authcontroller");

const router = express.Router();

// Login a user

router.post("/login/undergrad", loginUndergrad);
router.post("/login/postgrad", loginPostgrad);
router.post("/login/allother", loginOther);
router.post("/forgot-password", forgotPassword );
router.post("/resetpassword", resetPassword );
router.post("/resendotp", resendOTP );

module.exports = router;