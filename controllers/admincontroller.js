const User = require("../models/User");
const Course = require('../models/Course'); // Adjust the path as necessary
const Department = require('../models/Department')
const Marks=require("../models/Mark")
const Enrollment = require('../models/Enrollement');

const bcrypt = require("bcryptjs");
const { verifyToken } = require("../utils/token");
const CourseAssignment = require('../models/CourseAssign'); 
// Register a new user  
const registerUser = async (req, res) => {
    console.log("Request body:", req.body); // Debug the request body
  
    const { name, email, password, role, department, year, semester, fatherName, dateOfBirth } = req.body;
  
    // Check if the requester is an admin
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
  
    try {
      const decoded = verifyToken(token);
      if (decoded.role !== "superadmin" && decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admins can register users." });
      }
  
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
  
      console.log("Checking if user exists with email:", email);
  
      // Check if the user already exists (case-insensitive and trim whitespace)
      const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
      console.log("Existing user:", existingUser);
  
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
  
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create a new user
      const newUser = new User({
        name,
        email: email.trim().toLowerCase(), // Ensure email is trimmed and lowercase
        password: hashedPassword,
        role,
        department,
        year,
        semester,
        fatherName,
        dateOfBirth,
      });
  
      // Save the user to the database
      await newUser.save();
  
      res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (err) {
      console.error("Error registering user:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  const editUser = async (req, res) => {
    const { userId } = req.params;
    const { name, email, role, department, year, semester, fatherName, dateOfBirth } = req.body;
  
   
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
  
    try {
      const decoded = verifyToken(token);
      if (decoded.role !== "superadmin" && decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admins can edit users." });
      }
  
      // Find the user by ID
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Update user details
      user.name = name || user.name;
      user.email = email || user.email;
      user.role = role || user.role;
      user.department = department || user.department;
      user.year = year || user.year;
      user.semester = semester || user.semester;
      user.fatherName = fatherName || user.fatherName;
      user.dateOfBirth = dateOfBirth || user.dateOfBirth;
  
      // Save the updated user
      await user.save();
  
      res.status(200).json({ message: "User updated successfully", user });
    } catch (err) {
      console.error("Error editing user:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  const deleteUser = async (req, res) => {
    const { userId } = req.params;
  
    // Check if the requester is an admin
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
  
    try {
      const decoded = verifyToken(token);
      if (decoded.role !== "superadmin" && decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admins can delete users." });
      }
  
      // Find and delete the user
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
      console.error("Error deleting user:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };

  const getAllUsers = async (req, res) => {
    // Check if the requester is an admin
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
  
    try {
      const decoded = verifyToken(token);
      if (decoded.role !== "superadmin" && decoded.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admins can fetch users." });
      }
  
      // Fetch all users
      const users = await User.find();
  
      res.status(200).json({ message: "Users fetched successfully", users });
    } catch (err) {
      console.error("Error fetching users:", err.message);
      res.status(500).json({ message: "Server error" });
    }
  };

  const createCourse = async (req, res) => {
    const { courseName, department, semester, section } = req.body;
  
    try {
      // Check if the department exists
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(400).json({ message: 'Invalid department ID' });
      }
  
      // Create the course
      const newCourse = new Course({
        courseName,
        department,
        semester,
        section,
        teacher: null, // Initially no teacher assigned
        enrolledStudents: [], // Initially no students enrolled
      });
  
      await newCourse.save();
      res.status(201).json({ message: 'Course created successfully', course: newCourse });
    } catch (error) {
      console.error('Error creating course:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
 
 
  const assignCourseToTeacher = async (req, res) => {
    const { course, teacher } = req.body;
    const assignedBy = req.user.id; // Admin ID from the token
  
    try {
      // Check if the course exists
      const courseExists = await Course.findById(course);
      if (!courseExists) {
        return res.status(400).json({ message: 'Invalid course ID' });
      }
  
      // Check if the teacher exists and is a teacher
      const teacherUser = await User.findById(teacher);
      if (!teacherUser || teacherUser.role !== 'teacher') {
        return res.status(400).json({ message: 'Invalid teacher ID or not a teacher' });
      }
  
      // Assign the course to the teacher
      courseExists.teacher = teacher;
      await courseExists.save();
  
      // Create a course assignment record
      const newAssignment = new CourseAssignment({
        course,
        teacher,
        assignedBy,
      });
  
      await newAssignment.save();
      res.status(201).json({ message: 'Course assigned to teacher successfully', assignment: newAssignment });
    } catch (error) {
      console.error('Error assigning course:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  


const createDepartment = async (departmentData) => {
  const { departmentName } = departmentData;

  try {
    // Check if the department already exists
    const existingDepartment = await Department.findOne({ departmentName });
    if (existingDepartment) {
      throw new Error('Department already exists');
    }

    // Create the department
    const newDepartment = new Department({
      departmentName,
    });

    await newDepartment.save();
    return newDepartment;
  } catch (error) {
    throw new Error(`Error creating department: ${error.message}`);
  }
};

const getAllStudentsMarks = async (req, res) => {
  try {
      // Fetch all students (undergrad and postgrad)
      const students = await User.find({ role: { $in: ['undergrad', 'postgrad'] } }).select('name department semester');

      if (!students || students.length === 0) {
          return res.status(404).json({ message: 'No students found' });
      }

      // Fetch all marks and populate course and student details
      const marks = await Marks.find()
          .populate('course', 'courseName department semester') // Populate course details
          .populate('student', 'name department semester'); // Populate student details

      if (!marks || marks.length === 0) {
          return res.status(404).json({ message: 'No marks found' });
      }

      // Organize marks by student
      const studentMarksMap = new Map();

      marks.forEach(mark => {
          const studentId = mark.student._id.toString();

          if (!studentMarksMap.has(studentId)) {
              studentMarksMap.set(studentId, {
                  studentId: studentId,
                  studentName: mark.student.name,
                  department: mark.student.department,
                  semester: mark.student.semester,
                  marks: []
              });
          }

          studentMarksMap.get(studentId).marks.push({
              markId: mark._id,  // Include marks ID here
              courseName: mark.course.courseName,
              courseDepartment: mark.course.department,
              courseSemester: mark.course.semester,
              marksObtained: mark.marksObtained,
              totalMarks: mark.totalMarks
          });
      });

      // Convert the map to an array
      const response = Array.from(studentMarksMap.values());

      res.status(200).json({ message: 'All students marks fetched successfully', data: response });
  } catch (error) {
      console.error('Error fetching all students marks:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const editMarks = async (req, res) => {
  const { id } = req.params; // Marks ID to be updated
  const { marksObtained, totalMarks } = req.body; // Updated marks data
  const userId = req.user.id; // User ID from the token
  const userRole = req.user.role; // User role from the token

  try {
      // Check if the user is an admin
      if (userRole !== 'superadmin') {
          return res.status(403).json({ message: 'Only admins can edit marks' });
      }

      // Validate input
      if (!marksObtained || !totalMarks || isNaN(marksObtained) || isNaN(totalMarks)) {
          return res.status(400).json({ message: 'Invalid marks data' });
      }

      // Find the marks record
      const marks = await Marks.findById(id);
      if (!marks) {
          return res.status(404).json({ message: 'Marks record not found' });
      }

      // Update the marks
      marks.marksObtained = marksObtained;
      marks.totalMarks = totalMarks;
      await marks.save();

      // Return the updated marks
      res.status(200).json({ message: 'Marks updated successfully', marks });
  } catch (error) {
      console.error('Error updating marks:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const approveEnrollment = async (req, res) => {
  const { enrollmentId } = req.params;
  const adminId = req.user.id; // Admin ID from the token

  try {
      // Check if the user is an admin
      if (req.user.role !== 'superadmin') {
          return res.status(403).json({ message: 'Only admins can approve enrollments' });
      }

      // Find the enrollment record
      const enrollment = await Enrollment.findById(enrollmentId);
      if (!enrollment) {
          return res.status(404).json({ message: 'Enrollment not found' });
      }

      // Approve the enrollment
      enrollment.isApproved = true;
      await enrollment.save();

      // Add the student to the course's enrolledStudents list
      const course = await Course.findById(enrollment.course);
      if (!course.enrolledStudents.includes(enrollment.student)) {
          course.enrolledStudents.push(enrollment.student);
          await course.save();
      }

      res.status(200).json({ message: 'Enrollment approved successfully', enrollment });
  } catch (error) {
      console.error('Error approving enrollment:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const startNewEnrollment = async (req, res) => {
  const { department, semester } = req.body;
  const adminId = req.user.id; // Admin ID from the token

  try {
      // Check if the user is an admin
      if (req.user.role !== 'superadmin') {
          return res.status(403).json({ message: 'Only admins can start new enrollment' });
      }

      // Start enrollment for the next semester
      await startEnrollment({ body: { department, semester }, user: { id: adminId, role: 'superadmin' } }, res);
  } catch (error) {
      console.error('Error starting new enrollment:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateSemesterForPassedStudents = async (req, res) => {
  const { department, semester } = req.body;
  const adminId = req.user.id; // Admin ID from the token

  try {
      // Check if the user is an admin
      if (req.user.role !== 'superadmin') {
          return res.status(403).json({ message: 'Only admins can update semesters' });
      }

      // Fetch all students in the department and semester
      const students = await User.find({ department, semester, role: { $in: ['undergrad', 'postgrad'] } });

      if (!students || students.length === 0) {
          return res.status(404).json({ message: 'No students found for this department and semester' });
      }

      // Update semester for students who passed
      const updatePromises = students.map(async (student) => {
          const marks = await Marks.find({ student: student._id, semester });
          const totalMarks = marks.reduce((sum, mark) => sum + mark.marksObtained, 0);
          const totalPossibleMarks = marks.reduce((sum, mark) => sum + mark.totalMarks, 0);

          // Check if the student passed (60% criteria)
          if ((totalMarks / totalPossibleMarks) >= 0.6) {
              student.semester += 1; // Move to the next semester
              await student.save();
          }
      });

      await Promise.all(updatePromises);

      res.status(200).json({ message: 'Semester updated successfully for passed students' });
  } catch (error) {
      console.error('Error updating semester:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = { registerUser,editUser,deleteUser,getAllUsers,createCourse,assignCourseToTeacher,createDepartment,getAllStudentsMarks,editMarks ,approveEnrollment,startNewEnrollment,updateSemesterForPassedStudents};