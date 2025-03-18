const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connectionString = "mongodb+srv://booalikazmi442:notissueforme@cluster0.gwkyr.mongodb.net/test?retryWrites=true&w=majority";

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
