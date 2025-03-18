const express = require("express");
const { assignMarksToStudent } = require("../controllers/teachercontroller");

const router = express.Router();

// Login a user
router.post("/assignmarks",assignMarksToStudent);


module.exports = router;