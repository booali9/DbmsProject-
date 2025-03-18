const express = require("express");
const { enrollStudentInCourse,getStudentMarks,enrollInCourse,getCoursesForStudent } = require("../controllers/studentController");

const router = express.Router();

// Login a user
router.post("/coursenrolled",enrollStudentInCourse);
router.post("/courseenroll",enrollInCourse);
// Login a user
router.post("/studentMarks",getStudentMarks);
router.get("/getstudentcourse",getCoursesForStudent);


module.exports = router;