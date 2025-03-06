const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentFor: { type: String, required: true }, // e.g., "semester fees", "canteen bill"
  paymentProof: { type: String, required: true }, // URL of the payment proof
});

module.exports = mongoose.model('Payment', paymentSchema);