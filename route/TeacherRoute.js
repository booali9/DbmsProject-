const express = require('express');
const router = express.Router();
const {
  getAssignedCourses,
  markAttendance,
  getCourseAttendance,
  assignMarks,
  getCourseMarks
} = require('../controllers/teachercontroller');
const { authenticate } = require('../middleware/authMiddleware');

// Get courses assigned to teacher
router.get('/courses', authenticate,  getAssignedCourses);

// Mark attendance for a course
router.post('/attendance', authenticate,markAttendance);

// Get attendance for a specific course
router.get('/courses/:courseId/attendance', authenticate,  getCourseAttendance);

// Assign marks to students
router.post('/marks', authenticate,  assignMarks);

// Get marks for a specific course
router.get('/courses/:courseId/marks', authenticate, getCourseMarks);

module.exports = router;