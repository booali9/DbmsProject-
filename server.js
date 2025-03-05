const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./utils/connect");
const authRoute = require("./route/authRoutes");
const adminRoute = require("./route/adminRoutes");
const studentRoute = require("./route/studentRoutes");
const teacherRoute = require("./route/teacherRoutes");

// Load environment variables
dotenv.config();

// Create an Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoute); // Authentication routes
app.use("/api/admin", adminRoute); // Admin-only routes
app.use("/api/student", studentRoute); // Student-only routes
app.use("/api/teacher", teacherRoute); // Teacher-only routes

// ✅ Export the Express app for Vercel
module.exports = app;
//