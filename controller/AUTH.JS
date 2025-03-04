const User = require("../models/User");
const bcrypt = require("bcryptjs");

const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { userId, password } = req.body;

  try {
    // Find the user by userId
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};
exports.registerUser = async (req, res) => {
    const { name, email, password, userId, year, department, role } = req.body;
  
    // Check if the requester is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admins can register users" });
    }
  
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        userId,
        year,
        department,
        role,
      });
  
      await user.save();
      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error registering user", error: err.message });
    }
  };
  
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Generate a random code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
      // Save the code to the user
      user.resetPasswordCode = resetCode;
      await user.save();
  
      // Send the code via email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Code",
        text: `Your password reset code is: ${resetCode}`,
      };
  
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "Reset code sent to your email" });
    } catch (err) {
      res.status(500).json({ message: "Error sending reset code", error: err.message });
    }
  };

  exports.resendCode = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Generate a new random code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  
      // Save the new code to the user
      user.resetPasswordCode = resetCode;
      await user.save();
  
      // Send the new code via email
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
  
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "New Password Reset Code",
        text: `Your new password reset code is: ${resetCode}`,
      };
  
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: "New reset code sent to your email" });
    } catch (err) {
      res.status(500).json({ message: "Error resending reset code", error: err.message });
    }
  };
  
  exports.resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user || user.resetPasswordCode !== code) {
        return res.status(400).json({ message: "Invalid code" });
      }
  
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetPasswordCode = null; // Clear the reset code
      await user.save();
  
      res.status(200).json({ message: "Password reset successfully" });
    } catch (err) {
      res.status(500).json({ message: "Error resetting password", error: err.message });
    }
  };