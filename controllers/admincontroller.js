const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Register a new user
const registerUser = async (req, res) => {
  const { name, email, password, role, department, year, semester, fatherName, dateOfBirth } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      name,
      email,
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

module.exports = { registerUser };