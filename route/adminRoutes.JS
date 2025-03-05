const express = require("express");
const router = express.Router();
const { authMiddleware, roleMiddleware } = require("../middlewear/authMiddleware");
const adminController = require("../controllers/Admincontroller");

// Admin-only routes
router.post("/register-user", authMiddleware, roleMiddleware(["admin"]), adminController.registerUser);
router.put("/users/:userId", authMiddleware, roleMiddleware(["admin"]), adminController.editUser);
router.delete("/users/:userId", authMiddleware, roleMiddleware(["admin"]), adminController.deleteUser);
router.get("/users", authMiddleware, roleMiddleware(["admin"]), adminController.getAllUsers);
router.post("/open-registration", authMiddleware, roleMiddleware(["admin"]), adminController.openRegistration);
router.post("/approve-registration", authMiddleware, roleMiddleware(["admin"]), adminController.approveRegistration);
router.post("/lock-attendance", authMiddleware, roleMiddleware(["admin"]), adminController.lockAttendance);

module.exports = router;