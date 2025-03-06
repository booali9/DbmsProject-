const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true }, // Department offering the course
  semester: { type: Number, required: true }, // Semester in which the course is offered
  section: { type: String, required: true }, // Section (e.g., A, B, C)
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Assigned teacher (initially null)
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Students enrolled in the course
});

module.exports = mongoose.model('Course', courseSchema);