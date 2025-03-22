const express = require("express");
const { assignMarksToStudent, markAttendance,getTeacherCourseAttendance } = require("../controllers/teachercontroller");

const router = express.Router();

// Login a user
router.post("/assignmarks",assignMarksToStudent);
router.post("/markattendance",markAttendance);
router.get("/getattendancof teacher",getTeacherCourseAttendance);


module.exports = router;  