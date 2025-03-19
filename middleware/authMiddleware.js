const User = require("../models/User");
const jwt=require("jsonwebtoken")

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
  try {
    console.log("Checking admin status. req.user:", req.user); // Debugging log

    // Ensure `req.user` is defined
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: No user found in request" });
    }

    const userId = req.user.id;

    // Find the user in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the user is an admin or super admin
    if (user.role === "superadmin" || user.role === "admin") {
      return next();
    } else {
      return res.status(403).json({ message: "Access denied. Only admins can perform this action." });
    }
  } catch (err) {
    console.error("Error in isAdmin middleware:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log("Decoded token:", decoded); // Debugging log

    // Check token structure
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid token structure" });
    }

    req.user = decoded; // Assign user details to req.user
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};




module.exports = { isAdmin,authenticate };