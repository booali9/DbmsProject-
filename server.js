const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./utils/connect");
const http = require("http");
const socketio = require("socket.io");
const path = require("path");
const adminRoutes = require("./route/AdminRoute");
const authRoute = require("./route/AuthRoute");
const StudentRoute = require("./route/StudentRoute");
const TeacherRoute = require("./route/TeacherRoute");
const CanteenRoute = require("./route/CanteenRoute");
const LocationRoute = require("./route/LocationRoute");

// Load environment variables
dotenv.config();

// Create an Express app
const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*", // Allow specific origins
    methods: ["GET", "POST"],
  },
});

// Set view engine and static files
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/user", authRoute);
app.use("/api/student", StudentRoute);
app.use("/api/teacher", TeacherRoute);
app.use("/api/canteen", CanteenRoute);
app.use("/api/location",  LocationRoute);

// Store user locations in memory
const userLocations = new Map();

// Socket.io Implementation
io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);

  // Send existing user locations to the newly connected user
  socket.emit("initial-locations", Array.from(userLocations.entries()));

  // Handle location updates
 // Broadcast location updates to all clients
function broadcastLocationUpdate(userId, locationData) {
  io.emit('location-update', {
    type: 'location-update',
    userId,
    ...locationData
  });
}

// Modify your existing location handler
socket.on("send-location", (data) => {
  const { latitude, longitude, role, userId } = data;
  
  if (role === 'point') {
    userLocations.set(userId, { latitude, longitude, role });
    broadcastLocationUpdate(userId, { latitude, longitude });
  }
});

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    userLocations.delete(socket.id); // Remove the user's location
    io.emit("user-disconnect", socket.id); // Notify other clients
  });
});



// Set port dynamically for hosting and local development
const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Render the index page
app.get("/", function (req, res) {
  res.render("index");
});

module.exports = { app, io };