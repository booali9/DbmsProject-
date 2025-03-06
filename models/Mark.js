const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  semester: { type: Number, required: true },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
});

module.exports = mongoose.model('Marks', marksSchema);