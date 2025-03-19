const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connectionString = process.env.MONGO_URL;
    console.log(process.env.MONGO_URL)

    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });
   
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
