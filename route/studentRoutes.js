const express = require("express");
const router = express.Router();
const { authMiddleware, roleMiddleware } = require("../middlewear/authMiddleware");
const studentController = require("../controllers/Studentcontroller");

// Student-only routes
router.post("/register-course", authMiddleware, roleMiddleware(["Undergraduate", "PostGraduate"]), studentController.registerCourse);
router.get("/attendance/:courseId", authMiddleware, roleMiddleware(["Undergraduate", "PostGraduate"]), studentController.viewAttendance);
router.get("/marks", authMiddleware, roleMiddleware(["Undergraduate", "PostGraduate"]), studentController.viewMarks);

module.exports = router;