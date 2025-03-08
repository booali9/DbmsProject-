const mongoose = require("mongoose");

const connectDB = async () => {
  try {
   
    console.log(process.env.MONGO_URL)
    await mongoose.connect(process.env.MONGO_URL, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });
    
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1); // Exit the process with a failure code
  }  
};

module.exports = connectDB;