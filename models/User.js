const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ["superadmin", "undergrad", "postgrad", "teacher", "canteen"] 
  },
  department: { type: String }, // Only for students and teachers
  year: { type: Number }, // Only for students
  semester: { type: Number }, // Only for students
  fatherName: { type: String }, // Only for students
  dateOfBirth: { type: Date }, // Only for students
  registrationDate: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false }, // For fee approval
  feesProof: { type: String }, // URL of the uploaded fee receipt
});

module.exports = mongoose.model('User', userSchema);