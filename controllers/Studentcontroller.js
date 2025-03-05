const User = require("../models/User");

// Register for a course
exports.registerCourse = async (req, res) => {
  const { userId, courseId, semester, paymentSlip } = req.body;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.registeredCourses.push({ courseId, semester, paymentSlip });
    await user.save();
    res.status(200).json({ message: "Course registration pending approval", user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// View attendance for a course
exports.viewAttendance = async (req, res) => {
  const { courseId } = req.params;
  const { userId } = req.user;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const attendance = user.attendance.filter((a) => a.courseId.toString() === courseId);
    res.status(200).json({ attendance });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// View marks and CGPA
exports.viewMarks = async (req, res) => {
  const { userId } = req.user;

  try {
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ marks: user.marks, cgpa: user.cgpa });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};