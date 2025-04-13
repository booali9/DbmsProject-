const express = require("express");
const { enrollStudentInCourse,getStudentMarks,getAvailableCourses,enrollInCourses,getCoursesForStudent,getAllEnrollmentsForAdmin, getStudentAttendance, submitFeedback } = require("../controllers/studentController");
const { isAdmin } = require("../middleware/authMiddleware");
const {authenticate} = require("../middleware/authMiddleware");
const router = express.Router();

// Login a user
router.post("/coursenrolled",enrollStudentInCourse);
router.post("/courseenroll",enrollInCourses);

  
// Login a user
router.post("/studentMarks",getStudentMarks);
router.get("/getstudentcourse",authenticate,getCoursesForStudent);
router.get("/getenrollment",getAllEnrollmentsForAdmin, authenticate, isAdmin);
router.get("/getattendance",getStudentAttendance, authenticate, isAdmin);
router.get("/getattendance",getAvailableCourses, authenticate);
router.post("/submitfeedback",submitFeedback, authenticate);



module.exports = router;