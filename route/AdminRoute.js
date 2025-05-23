const express = require("express");
const {
  registerUser,
  editUser,
  deleteUser,
  getAllUsers,
  createCourse,
  assignCourseToTeacher,
  createDepartment,
  getAllStudentsMarks,
  editMarks,
  approveEnrollment,
  startNewEnrollment,
  updateSemesterForPassedStudents,
  editDepartment,
  editCourse,
  editAssignedCourse,
  stopEnrollment,
  endSemester,
  getAllAttendance,
  getAllFeedback,
  getAllCourses,
  getAllDepartments,
  getActiveEnrollments,
  getEnrollmentStudents,
  getAllStudentAttendance,
  getAllStudentMarks,
  getAllPendingEnrollments,
  bulkApproveEnrollments,
 getAllStudents,
  getAllMarks,
  updateAttendance,
  updateMarks

} = require("../controllers/admincontroller");
const { isAdmin } = require("../middleware/authMiddleware");
const {authenticate} = require("../middleware/authMiddleware");
const { getCoursesForStudent } = require("../controllers/studentController");

const router = express.Router();

// Apply middleware and routes
router.post("/register", authenticate, isAdmin, registerUser);
router.delete("/deleteuser/:userId", authenticate, isAdmin, deleteUser);
router.get("/getalluser", authenticate, isAdmin, getAllUsers);
router.put("/edituser/:userId", authenticate, isAdmin, editUser);
router.post("/createdepartment", authenticate, isAdmin, createDepartment);
router.put("/editdepartment/:id", authenticate, isAdmin, editDepartment);
router.post("/createcourse", authenticate, isAdmin, createCourse);
router.put("/editcourse/:id", authenticate, isAdmin, editCourse);
router.post("/assign-course", authenticate, isAdmin, assignCourseToTeacher);
router.put("/editAssignedCourse/:id", authenticate, isAdmin, editAssignedCourse);
router.post("/startenrollment", authenticate, isAdmin, startNewEnrollment);
router.post("/stopenrollement", authenticate, isAdmin, stopEnrollment);
router.post("/bulkenrollementapprove", authenticate, isAdmin,bulkApproveEnrollments );
router.get("/courses", authenticate, isAdmin,getAllCourses);
router.get("/departments", authenticate, isAdmin, getAllDepartments);
router.get("/active-enrollments", authenticate, isAdmin,getActiveEnrollments);
router.get("/getenrollementstudent", authenticate, isAdmin, getEnrollmentStudents);
router.get("/getpendingenrollement", authenticate, isAdmin, getAllPendingEnrollments);

router.get('/attendance', authenticate, isAdmin, getAllStudentAttendance);

// Get all student marks
router.get('/marks', authenticate, isAdmin, getAllStudentMarks);

router.get('/attendance', authenticate, isAdmin, getAllAttendance);
router.put('/attendance/:attendanceId', authenticate, isAdmin, updateAttendance);
router.get('/marks', authenticate, isAdmin, getAllMarks);
router.put('/marks/:marksId', authenticate, isAdmin, updateMarks);
router.get('/students', authenticate, isAdmin, getAllStudents);

router.get("/getallstudenTmarks", authenticate, isAdmin, getAllStudentsMarks);
router.get("/getallfedback", authenticate, isAdmin, getAllFeedback);
router.get("/getallstudentattendance", authenticate, isAdmin, getAllAttendance);
router.put("/editmark", authenticate, isAdmin, editMarks);
router.post("/approveenrollement", authenticate, isAdmin, approveEnrollment);

router.post("/updatesemester", authenticate, isAdmin,updateSemesterForPassedStudents );
router.put("/endsemester", authenticate, isAdmin,endSemester );

module.exports = router;