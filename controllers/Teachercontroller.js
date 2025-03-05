const User = require("../models/User");

// Mark attendance for a student
exports.markAttendance = async (req, res) => {
  const { userId, courseId, status } = req.body;

  try {
    const student = await User.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.attendance.push({ courseId, status });
    await student.save();
    res.status(200).json({ message: "Attendance marked", student });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Submit marks for a student
exports.submitMarks = async (req, res) => {
  const { userId, courseId, marksObtained } = req.body;

  try {
    const student = await User.findOne({ userId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const course = student.marks.find((c) => c.courseId.toString() === courseId);
    if (course) {
      course.marksObtained = marksObtained;
    } else {
      student.marks.push({ courseId, marksObtained });
    }

    await student.save();
    res.status(200).json({ message: "Marks submitted", student });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};