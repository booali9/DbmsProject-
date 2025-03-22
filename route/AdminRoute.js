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
  getAllFeedback
} = require("../controllers/admincontroller");
const { isAdmin } = require("../middleware/authMiddleware");
const {authenticate} = require("../middleware/authMiddleware");

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




router.get("/getallstudenTmarks", authenticate, isAdmin, getAllStudentsMarks);
router.get("/getallfedback", authenticate, isAdmin, getAllFeedback);
router.get("/getallstudentattendance", authenticate, isAdmin, getAllAttendance);
router.put("/editmark", authenticate, isAdmin, editMarks);
router.post("/approveenrollement", authenticate, isAdmin, approveEnrollment);

router.post("/updatesemester", authenticate, isAdmin,updateSemesterForPassedStudents );
router.put("/endsemester", authenticate, isAdmin,endSemester );

module.exports = router;