const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Store active point users in memory (for real-time updates)
const activePointUsers = new Map();

// Set location endpoint
router.post("/set", async (req, res) => {
  try {
    const { userId, longitude, latitude, role } = req.body;

    if (!longitude || !latitude || !userId || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Only store point users (like delivery personnel)
    if (role === 'point') {
      activePointUsers.set(userId, {
        coordinates: [longitude, latitude],
        lastUpdated: new Date()
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        lastLocationUpdate: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      message: "Location updated successfully",
      location: updatedUser.location
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all point users locations
router.get("/point-users", async (req, res) => {
  try {
    // Convert the Map to an array of objects
    const pointUsers = Array.from(activePointUsers.entries()).map(([userId, data]) => ({
      userId,
      longitude: data.coordinates[0],
      latitude: data.coordinates[1],
      lastUpdated: data.lastUpdated
    }));

    res.status(200).json(pointUsers);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;