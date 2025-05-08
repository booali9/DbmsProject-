const mongoose = require("mongoose");

const uri = "mongodb+srv://kazmi12:notissueforme@cluster0.ddy12.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 5000 }) // 5-second timeout
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
    process.exit(0); // Exit on success
  })  
  .catch((err) => {
    console.error("❌ Failed to connect to MongoDB:", err.message);
    process.exit(1); // Exit on failure
  });
