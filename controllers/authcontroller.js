const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/token");
const nodemailer = require("nodemailer");

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kazmistore423@gmail.com",
    pass: "qykn uxky jxsx yiep",
  },
  debug: true, // Enable debugging
  logger: true, // Enable logging
});

// Function to send an OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.`,
  };

  console.log("Attempting to send email...");
  console.log("Mail Options:", mailOptions);
  console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Function to generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Forgot Password Function
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new OTP
    const otp = generateOTP();

    // Save OTP and expiry time
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    await user.save();

    // Send the OTP
    await sendOTPEmail(user.email, otp);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error in forgot password:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Resend OTP Function
const resendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a new OTP
    const otp = generateOTP();

    // Save the new OTP and expiry time
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    await user.save();

    // Send the new OTP via email
    await sendOTPEmail(user.email, otp);

    res.status(200).json({ message: "New OTP sent successfully" });
  } catch (err) {
    console.error("Error in resending OTP:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Login Function
const loginWithRole = async (req, res, allowedRoles) => {
  const { email, password } = req.body;
  console.log("Login Attempt with:", email, password);

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    console.log("User Found:", user);

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if user's role is allowed for this endpoint
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Access denied for this login endpoint" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log("Password Match:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id, user.role);
    res.status(200).json({ message: "Login successful", token, user });
  } catch (err) {
    console.error("Error logging in:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Specific login controllers for each role

const loginUndergrad = async (req, res) => {
  await loginWithRole(req, res, ["undergrad"]);
};

const loginPostgrad = async (req, res) => {
  await loginWithRole(req, res, ["postgrad"]);
};



// For other roles or general login (if needed)
const loginOther = async (req, res) => {
  await loginWithRole(req, res, ["teacher", "canteen", "point","superadmin"]); // Add any other roles you want to allow here
};

// Reset Password Function
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.resetPasswordOTP !== otp || user.resetPasswordOTPExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password and clear the OTP
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Error resetting password:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { 
  loginUndergrad,
  loginPostgrad,loginOther, forgotPassword, resetPassword, resendOTP };
