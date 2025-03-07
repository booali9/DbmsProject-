const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { verifyToken } = require("../utils/token");
// Register a new user
const registerUser = async (req, res) => {
    console.log("Request body:", req.body); // Debug the request body
  
    const { name, email, password, role, department, year, semester, fatherName, dateOfBirth } = req.body;
  
    // Check if the requester is an admin
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
  
    try {
      const decoded = verifyToken(token);
      if (decoded.role !== "superadmin" && decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admins can register users." });
      }
  
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
  
      console.log("Checking if user exists with email:", email);
  
      // Check if the user already exists (case-insensitive and trim whitespace)
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      console.log("Existing user:", existingUser);
  
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create a new user
      const newUser = new User({
        name,
        email: email.trim().toLowerCase(), // Ensure email is trimmed and lowercase
        password: hashedPassword,
        role,
        department,
        year,
        semester,
        fatherName,
        dateOfBirth,
      });
  
      // Save the user to the database
      await newUser.save();
  
      res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (err) {
      console.error("Error registering user:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  const editUser = async (req, res) => {
    const { userId } = req.params;
    const { name, email, role, department, year, semester, fatherName, dateOfBirth } = req.body;
  
   
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
  
    try {
      const decoded = verifyToken(token);
      if (decoded.role !== "superadmin" && decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admins can edit users." });
      }
  
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Update user details
      user.name = name || user.name;
      user.email = email || user.email;
      user.role = role || user.role;
      user.department = department || user.department;
      user.year = year || user.year;
      user.semester = semester || user.semester;
      user.fatherName = fatherName || user.fatherName;
      user.dateOfBirth = dateOfBirth || user.dateOfBirth;
  
      // Save the updated user
      await user.save();
  
      res.status(200).json({ message: "User updated successfully", user });
    } catch (err) {
      console.error("Error editing user:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  const deleteUser = async (req, res) => {
    const { userId } = req.params;
  
    // Check if the requester is an admin
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
  
    try {
      const decoded = verifyToken(token);
      if (decoded.role !== "superadmin" && decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admins can delete users." });
      }
  
      // Find and delete the user
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      console.error("Error deleting user:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };

  const getAllUsers = async (req, res) => {
    // Check if the requester is an admin
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
  
    try {
      const decoded = verifyToken(token);
      if (decoded.role !== "superadmin" && decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admins can fetch users." });
      }
  
      // Fetch all users
      const users = await User.find();
  
      res.status(200).json({ message: "Users fetched successfully", users });
    } catch (err) {
      console.error("Error fetching users:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };

module.exports = { registerUser,editUser,deleteUser,getAllUsers };