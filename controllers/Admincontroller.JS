const User = require("../models/User");
const Course = require("../models/Course");
const Semester = require("../models/Semester");

// Register a new user
exports.registerUser = async (req, res) => {
  const { name, email, password, userId, year, department, role } = req.body;

  try {
    const user = new User({ name, email, password, userId, year, department, role });
    await user.save();
    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Edit user details
exports.editUser = async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;

  try {
    const user = await User.findOneAndUpdate({ userId }, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User updated successfully", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a user
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findOneAndDelete({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({ users });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Open course registration for a semester
exports.openRegistration = async (req, res) => {
  const { semester, year, department } = req.body;

  try {
    const semesterDoc = await Semester.findOneAndUpdate(
      { semester, year, department },
      { registrationOpen: true },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: "Registration opened", semesterDoc });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Approve course registration
exports.approveRegistration = async (req, res) => {
  const { userId, courseId } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const course = user.registeredCourses.find((c) => c.courseId.toString() === courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.status = "approved";
    await user.save();
    res.status(200).json({ message: "Course registration approved", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Lock attendance for a semester
exports.lockAttendance = async (req, res) => {
  const { semester, year, department } = req.body;

  try {
    const semesterDoc = await Semester.findOneAndUpdate(
      { semester, year, department },
      { attendanceLocked: true },
      { new: true }
    );
    res.status(200).json({ message: "Attendance locked", semesterDoc });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};