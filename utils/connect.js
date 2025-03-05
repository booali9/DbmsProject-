const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    console.log(process.env.MONGO_URL)
    await mongoose.connect(`mongodb+srv://booali654:9Juw3atNMt9wrr0y@cluster0.2blct.mongodb.net/new?retryWrites=true&w=majority&appName=Cluster0`, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      tls: true, // Enable TLS/SSL
    });
    
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    process.exit(1);
  }
};

module.exports = connectDB;
