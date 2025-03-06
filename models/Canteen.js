const mongoose = require('mongoose');

const canteenSchema = new mongoose.Schema({
  menu: { type: String }, // Menu details
  bill: { type: String }, // URL of the uploaded bill
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Canteen owner
  submissionDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Canteen', canteenSchema);