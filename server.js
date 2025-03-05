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
app.use("/api/auth", authRoute); // Authentication routes (login, send OTP, reset password, etc.)
app.use("/api/admin", adminRoute); // Admin-only routes (register user, edit user, etc.)
app.use("/api/student", studentRoute); // Student-only routes (register course, view attendance, etc.)
app.use("/api/teacher", teacherRoute); // Teacher-only routes (mark attendance, submit marks, etc.)

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});