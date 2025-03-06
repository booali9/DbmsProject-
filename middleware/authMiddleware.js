const User = require("../models/User");

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
  try {
    // Get the user ID from the request (you can use authentication tokens or sessions)
    const userId = req.user.id; // Assuming you have a way to get the logged-in user's ID

    // Find the user in the database
    const user = await User.findById(userId);

    // Check if the user is an admin or super admin
    if (user.role === "superadmin" || user.role === "admin") {
      next(); // Allow the request to proceed
    } else {
      res.status(403).send("Access denied. Only admins can perform this action.");
    }
  } catch (err) {
    console.error("Error in isAdmin middleware:", err.message);
    res.status(500).send("Server error");
  }
};

module.exports = { isAdmin };