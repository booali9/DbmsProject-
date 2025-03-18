const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/token");
const nodemailer = require("nodemailer");

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail", // Use Gmail as the email service
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

// Function to send an OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender email address
    to: email, // Recipient email address
    subject: "Password Reset OTP", // Email subject
    text: `Your OTP for password reset is: ${otp}\n\nThis OTP is valid for 10 minutes.`, // Email body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP email sent successfully");
  } catch (err) {
    console.error("Error sending OTP email:", err.message);
  }
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  };
  
  // Forgot password
  const forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      // Find the user by email
      const user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Generate a 6-digit OTP
      const otp = generateOTP();
  
      // Save the OTP and its expiry time in the user's document
      user.resetPasswordOTP = otp;
      user.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now
      await user.save();
  
      // Send the OTP to the user's email
      await sendOTPEmail(user.email, otp);
  
      res.status(200).json({ message: "OTP sent successfully" });
    } catch (err) {
      console.error("Error in forgot password:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };
  


const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

  
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }


    const token = generateToken(user._id, user.role);

    res.status(200).json({ message: "Login successful", token,user });
  } catch (err) {
    console.error("Error logging in:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
  
    try {
      // Find the user by email
      const user = await User.findOne({ email: email.trim().toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Check if the OTP is valid and not expired
      if (user.resetPasswordOTP !== otp || user.resetPasswordOTPExpires < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Update the user's password and clear the OTP
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
  
  

module.exports = { loginUser ,forgotPassword,resetPassword};