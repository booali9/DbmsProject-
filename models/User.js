const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userId: { type: String, required: true, unique: true },
  year: { type: Number }, // For students
  department: { type: String }, // For students and teachers
  role: {
    type: String,
    enum: ["admin", "teacher", "Undergraduate", "PostGraduate"],
    required: true,
  },
  resetPasswordCode: { type: String },
  assignedCourses: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      semester: { type: String },
    },
  ],
  registeredCourses: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      semester: { type: String },
      status: { type: String, enum: ["pending", "approved"], default: "pending" },
      paymentSlip: { type: String }, // URL or path to the payment slip
    },
  ],
  attendance: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      date: { type: Date, default: Date.now },
      status: { type: String, enum: ["present", "absent"], default: "absent" },
    },
  ],
  marks: [
    {
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      marksObtained: { type: Number, default: 0 },
    },
  ],
  cgpa: { type: Number, default: 0 }, // Calculated CGPA
});

module.exports = mongoose.model("User", userSchema);