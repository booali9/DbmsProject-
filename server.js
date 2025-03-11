const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./utils/connect");
const adminRoutes = require("./route/AdminRoute");
const authRoute=require("./route/AuthRoute")

// Load environment variables
dotenv.config();

// Create an Express app
const app = express();  
  
// Connect to MongoDB   
connectDB();

// Middleware  
app.use(cors());  
app.use(express.json());  
app.use(express.json());   

app.use("/api/admin",adminRoutes)
app.use("/api/user",authRoute)

// Set port dynamically for hosting and local development
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; 
  