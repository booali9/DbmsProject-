const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  semester: { type: String, required: true },
  year: { type: Number, required: true }, // Added year
  credits: { type: Number, required: true }, // Added credits for CGPA calculation
});

module.exports = mongoose.model("Course", courseSchema);