const mongoose = require('mongoose');

// Change _id: false to _id: true (or just remove the option since it defaults to true)
const menuItemSchema = new mongoose.Schema({
  item: { type: String, required: true },
  price: { type: Number, required: true }
}, { _id: true });  // This ensures each menu item gets its own _id

const canteenSchema = new mongoose.Schema({
  menu: [menuItemSchema],
  bill: { type: String },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submissionDate: { type: Date, default: Date.now },
  updatedAt: { type: Date } // Add this for better tracking
});

module.exports = mongoose.model('Canteen', canteenSchema);