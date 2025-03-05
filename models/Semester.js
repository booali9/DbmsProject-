const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema({
  semester: { type: String, required: true },
  year: { type: Number, required: true },
  department: { type: String, required: true },
  registrationOpen: { type: Boolean, default: false }, // Admin controls this
  attendanceLocked: { type: Boolean, default: false }, // Admin locks attendance
});

module.exports = mongoose.model("Semester", semesterSchema);