const express = require("express");
const { registerUser,editUser,deleteUser,getAllUsers } = require("../controllers/admincontroller");
const { isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// Register a new user
router.post("/register", registerUser);
// Register a new user
router.post("/edituser/:userId", editUser);
router.post("/deleteuser/:userId", deleteUser);
router.post("/:userId", deleteUser);
router.post("/getalluser", getAllUsers);

module.exports = router;