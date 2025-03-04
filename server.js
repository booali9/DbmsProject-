// index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB=require("./utils/connect")
// Load environment variables
dotenv.config();

// Create an Express app
const app = express();

connectDB()

// Middleware
app.use(cors());
app.use(bodyParser.json());



// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});