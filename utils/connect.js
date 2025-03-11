// utils/connect.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Get the connection string from the environment variable
    const connectionString = process.env.MONGO_URL;
    console.log(process.env.MONGO_URL)
    
    // Connect to MongoDB using Mongoose
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });

    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;
