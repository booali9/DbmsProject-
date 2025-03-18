const User = require("../models/User");
const jwt=require("jsonwebtoken")

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

const authenticate =async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your secret key
    req.user = decoded.user; // Attach the user to the request object
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};


module.exports = { isAdmin,authenticate };