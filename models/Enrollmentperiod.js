const mongoose = require('mongoose');

const enrollmentPeriodSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  semester: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  isOpen: { type: Boolean, default: false }, // Admin must explicitly open enrollment
  maxCourses: { type: Number, default: 5 }, // Maximum courses per student
});

module.exports = mongoose.model("EnrollmentPeriod", enrollmentPeriodSchema);
