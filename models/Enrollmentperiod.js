const mongoose = require('mongoose');

const enrollmentPeriodSchema = new mongoose.Schema({
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
  semester: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  isOpen: { type: Boolean, default: true }, // Track if enrollment is still open
});

module.exports = mongoose.model("EnrollmentPeriod", enrollmentPeriodSchema);
