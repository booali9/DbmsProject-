const express = require("express");
const router = express.Router();
const { authMiddleware, roleMiddleware } = require("../middlewear/authMiddleware");
const teacherController = require("../controllers/Teachercontroller");

// Teacher-only routes
router.post("/mark-attendance", authMiddleware, roleMiddleware(["teacher"]), teacherController.markAttendance);
router.post("/submit-marks", authMiddleware, roleMiddleware(["teacher"]), teacherController.submitMarks);

module.exports = router;