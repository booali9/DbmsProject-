const mongoose = require('mongoose');

const courseAssignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Super admin who assigned the course
  assignmentDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CourseAssignment', courseAssignmentSchema);