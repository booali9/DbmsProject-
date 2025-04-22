const express = require("express");
const { enrollStudentInCourse,getStudentMarks,getAvailableCourses,enrollInCourses,getCoursesForStudent,getAllEnrollmentsForAdmin, getStudentAttendance, submitFeedback , getMyAttendance,  getMyMarks} = require("../controllers/studentController");
const { isAdmin } = require("../middleware/authMiddleware");
const {authenticate} = require("../middleware/authMiddleware");
const router = express.Router();

// Login a user
router.post("/coursenrolled",enrollStudentInCourse);
router.post("/courseenroll",authenticate,enrollInCourses);

  
// Login a user
router.post("/studentMarks",getStudentMarks);
router.get("/getstudentcourse",authenticate,getCoursesForStudent);
router.get("/getenrollment",getAllEnrollmentsForAdmin, authenticate, isAdmin);
router.get("/getattendance",authenticate, isAdmin,getStudentAttendance);
router.get("/getavailablecourses",authenticate,getAvailableCourses);
router.post("/submitfeedback", authenticate,submitFeedback);
router.get('/attendance', authenticate,getMyAttendance);

// Get student's own marks
router.get('/marks', authenticate,getMyMarks);



module.exports = router;




