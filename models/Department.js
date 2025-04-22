const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  departmentName: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  departmentName: { type: String },
});

module.exports = mongoose.model('Department', departmentSchema); 