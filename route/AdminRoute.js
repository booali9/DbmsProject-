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
  updateSemesterForPassedStudents
} = require("../controllers/admincontroller");
const { isAdmin } = require("../middleware/authMiddleware");
const {authenticate} = require("../middleware/authMiddleware");

const router = express.Router();

// Apply middleware and routes
router.post("/register", authenticate, isAdmin, registerUser);
router.post("/createcourse", authenticate, isAdmin, createCourse);
router.post("/assign-course", authenticate, isAdmin, assignCourseToTeacher);
router.post("/createdepartment", authenticate, isAdmin, createDepartment);
router.post("/edituser/:userId", authenticate, isAdmin, editUser);
router.post("/deleteuser/:userId", authenticate, isAdmin, deleteUser);
router.get("/getalluser", authenticate, isAdmin, getAllUsers);
router.get("/getallstudenTmarks", authenticate, isAdmin, getAllStudentsMarks);
router.put("/editmark", authenticate, isAdmin, editMarks);
router.post("/approveenrollement", authenticate, isAdmin, approveEnrollment);
router.post("/startenrollment", authenticate, isAdmin, startNewEnrollment);
router.post("/startenrollment", authenticate, isAdmin,updateSemesterForPassedStudents );

module.exports = router;