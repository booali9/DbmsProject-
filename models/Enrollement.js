const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true }, // Added department
  semester: { type: Number, required: true },
  enrollmentDate: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false }, // Approval status by admin
  isOpen: { type: Boolean, default: true }, // Track if enrollment is still open
});

module.exports = mongoose.model('Enrollment', enrollmentSchema);
