const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./utils/connect");
const http = require("http");
const socketio = require("socket.io");
const path = require("path");

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Vercel-specific Socket.io configuration
const io = socketio(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"]
  },
  transports: ['websocket'] // Critical for Vercel
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/admin", require("./route/AdminRoute"));
app.use("/api/user", require("./route/AuthRoute"));
app.use("/api/student", require("./route/StudentRoute"));
app.use("/api/teacher", require("./route/TeacherRoute"));
app.use("/api/canteen", require("./route/CanteenRoute"));
app.use("/api/location", require("./route/LocationRoute"));

// Socket.io logic
const userLocations = new Map();

io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);
  
  socket.emit("initial-locations", Array.from(userLocations.entries()));

  socket.on("send-location", (data) => {
    const { latitude, longitude, role, userId } = data;
    if (role === 'point') {
      userLocations.set(userId, { latitude, longitude, role });
      io.emit('location-update', {
        type: 'location-update',
        userId,
        latitude, 
        longitude
      });
    }
  });

  socket.on("disconnect", () => {
    userLocations.delete(socket.id);
    io.emit("user-disconnect", socket.id);
  });
});

// Health check endpoint (required for Vercel)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Vercel-specific export
module.exports = app; // Remove server.listen() in production
// Vercel requires module.exports for serverless functions
module.exports = app;

// Only listen locally during development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}