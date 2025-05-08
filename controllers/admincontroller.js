const User = require("../models/User");
const Course = require('../models/Course'); // Adjust the path as necessary
const Department = require('../models/Department')
const Marks=require("../models/Mark")
const Enrollment = require('../models/Enrollement');
const EnrollmentPeriod=require('../models/Enrollmentperiod')
const Attendance=require("../models/Attendance")
const mongoose = require("mongoose");

const bcrypt = require("bcryptjs");
const { verifyToken } = require("../utils/token");
const CourseAssignment = require('../models/CourseAssign'); 
// Register a new user  
const registerUser = async (req, res) => {
    console.log("Request body:", req.body); // Debug the request body
  
    const { name, email, password, role, department, year, semester, fatherName, dateOfBirth } = req.body;
  
    // Check if the requester is an admin
    const token = req.headers.authorization?.split(" ")[1];
    console.log(token)
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
 
  const editCourse = async (req, res) => {
    try {
      const { id } = req.params; // Get ID from request params
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid course ID format" });
      }
  
      const { courseName, department, semester, section } = req.body;
  
      // Find the course by ID
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
  
      // If department is updated, validate it
      if (department) {
        if (!mongoose.Types.ObjectId.isValid(department)) {
          return res.status(400).json({ message: "Invalid department ID format" });
        }
  
        const departmentExists = await Department.findById(department);
        if (!departmentExists) {
          return res.status(400).json({ message: "Department not found" });
        }
      }
  
      // Update course details
      course.courseName = courseName || course.courseName;
      course.department = department || course.department;
      course.semester = semester || course.semester;
      course.section = section || course.section;
  
      await course.save();
      res.status(200).json({ message: "Course updated successfully", course });
    } catch (error) {
      console.error("Error updating course:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  // Route
 
  
 
  


  const createDepartment = async (req, res) => {
    const { departmentName } = req.body;
  console.log(departmentName)
    if (!departmentName) {
      return res.status(400).json({ message: "Department name is required" });
    }
  
    try {
      // Check if the department already exists
      const existingDepartment = await Department.findOne({ departmentName });
      if (existingDepartment) {
        return res.status(400).json({ message: "Department already exists" });
      }
  
      // Create the department
      const newDepartment = new Department({ departmentName });
      await newDepartment.save();
  
      return res.status(201).json({ message: "Department created successfully", department: newDepartment });
    } catch (error) {
      console.error("Error creating department:", error.message);
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  
  const editDepartment = async (req, res) => {
    const { id } = req.params;
    const { departmentName } = req.body;
  
    if (!departmentName) {
      return res.status(400).json({ message: "Department name is required" });
    }
  
    try {
      // Check if department exists
      const department = await Department.findById(id);
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
  
      // Check if the new name is already taken
      const existingDepartment = await Department.findOne({ departmentName });
      if (existingDepartment && existingDepartment._id.toString() !== id) {
        return res.status(400).json({ message: "Department name already exists" });
      }
  
      // Update department
      department.departmentName = departmentName;
      await department.save();
  
      return res.status(200).json({ message: "Department updated successfully", department });
    } catch (error) {
      console.error("Error updating department:", error.message);
      return res.status(500).json({ message: "Server error", error: error.message });
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


const startNewEnrollment = async (req, res) => {
  const { department, semester, startDate, endDate } = req.body;

  try {
    // Ensure the user is a superadmin
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmins can start enrollment" });
    }

    // Validate department
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(400).json({ message: "Invalid department ID" });
    }

    // Check if an enrollment period is already open for this department & semester
    const existingEnrollment = await EnrollmentPeriod.findOne({ department, semester, isOpen: true });
    if (existingEnrollment) {
      return res.status(400).json({ message: "Enrollment is already open for this department and semester" });
    }

    // Close previous enrollment if still open (optional)
    await EnrollmentPeriod.updateMany({ department, isOpen: true }, { isOpen: false });

    // Create a new enrollment period
    const newEnrollmentPeriod = new EnrollmentPeriod({
      department,
      semester,
      startDate: startDate || new Date(), // Default to now if not provided
      endDate: endDate || null, // Optional, can be updated later
      isOpen: true,
    });

    await newEnrollmentPeriod.save();

    res.status(201).json({
      message: "New enrollment period started successfully",
      enrollmentPeriod: newEnrollmentPeriod,
    });

  } catch (error) {
    console.error("Error starting new enrollment:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const stopEnrollment = async (req, res) => {
  const { department, semester } = req.body;

  try {
    // Ensure the user is a superadmin
    if (!req.user || req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Only superadmins can stop enrollment" });
    }

    // Find the active enrollment period
    const enrollmentPeriod = await EnrollmentPeriod.findOne({ department, semester, isOpen: true });

    if (!enrollmentPeriod) {
      return res.status(404).json({ message: "No active enrollment found for this department and semester" });
    }

    // Close enrollment
    enrollmentPeriod.isOpen = false;
    await enrollmentPeriod.save();

    res.status(200).json({ message: "Enrollment period stopped successfully", enrollmentPeriod });

  } catch (error) {
    console.error("Error stopping enrollment:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
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
// In your backend controller
// In your backend controller
const assignCourseToTeacher = async (req, res) => {
  try {
    const { courseId, teacher } = req.body;
    const assignedBy = req.user._id; // Get admin ID from auth middleware

    if (!courseId || !teacher) {
      return res.status(400).json({ 
        success: false,
        message: "Course ID and teacher ID are required" 
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: "Course not found" 
      });
    }

    // Check if teacher exists and is a teacher
    const teacherUser = await User.findById(teacher);
    if (!teacherUser || teacherUser.role !== 'teacher') {
      return res.status(400).json({ 
        success: false,
        message: "Invalid teacher ID or user is not a teacher" 
      });
    }

    // Update course with teacher
    course.teacher = teacher;
    await course.save();

    // Create or update assignment record
    let assignment = await CourseAssignment.findOneAndUpdate(
      { course: courseId },
      { teacher, assignedBy },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Teacher assigned successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.errors
    });
  }
};

const editAssignedCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { teacher } = req.body;
    const assignedBy = req.user._id;

    if (!courseId || !teacher) {
      return res.status(400).json({ 
        success: false,
        message: "Course ID and teacher ID are required" 
      });
    }

    // Update course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { teacher },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ 
        success: false,
        message: "Course not found" 
      });
    }

    // Update assignment record
    const assignment = await CourseAssignment.findOneAndUpdate(
      { course: courseId },
      { teacher, assignedBy },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Edit assignment error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.errors
    });
  }
};

const endSemester = async (req, res) => {
  const { department, semester } = req.body;
  const adminId = req.user.id; // Admin ID from the token

  try {
      // Check if the user is an admin
      if (req.user.role !== 'superadmin') {
          return res.status(403).json({ message: 'Only admins can end semesters' });
      }

      // Close the enrollment period for the department and semester
      await EnrollmentPeriod.updateMany({ department, semester, isOpen: true }, { isOpen: false });

      // Update students' semester
      await User.updateMany({ department, semester, role: { $in: ['undergrad', 'postgrad'] } }, { $inc: { semester: 1 } });

      res.status(200).json({ message: 'Semester ended successfully' });
  } catch (error) {
      console.error('Error ending semester:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};



const getAllFeedback = async (req, res) => {
  try {
      // Check if the user is an admin
      if (req.user.role !== 'superadmin') {
          return res.status(403).json({ message: 'Only admins can fetch all feedback records' });
      }

      // Fetch all feedback records
      const feedback = await Feedback.find()
          .populate('student', 'name email')
          .populate('teacher', 'name email')
          .populate('course', 'courseName');

      if (!feedback || feedback.length === 0) {
          return res.status(404).json({ message: 'No feedback records found' });
      }

      // Format the response
      const response = feedback.map(record => ({
          studentName: record.student.name,
          studentEmail: record.student.email,
          teacherName: record.teacher.name,
          teacherEmail: record.teacher.email,
          courseName: record.course.courseName,
          semester: record.semester,
          feedback: record.feedback,
          date: record.date,
      }));

      res.status(200).json({ message: 'All feedback records fetched successfully', feedback: response });
  } catch (error) {
      console.error('Error fetching all feedback:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    
    // Properly send HTTP response
    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    console.error("Error fetching departments:", error.message);
    
    // Proper error response
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get single department by ID
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found"
      });
    }

    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error("Error fetching department:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('department', 'departmentName')
      .populate('teacher', 'name email')
      .populate('enrolledStudents', 'name email')
      .sort({ courseName: 1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get single course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('department', 'departmentName')
      .populate('teacher', 'name email')
      .populate('enrolledStudents', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error("Error fetching course:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const getActiveEnrollments = async (req, res) => {
  try {
    const activePeriods = await EnrollmentPeriod.find({ isOpen: true })
      .populate('department', 'departmentName')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: activePeriods.length,
      data: activePeriods
    });
  } catch (error) {
    console.error('Error fetching active enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get students in active enrollment period
const getEnrollmentStudents = async (req, res) => {
  try {
    const period = await EnrollmentPeriod.findById(req.params.periodId);
    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment period not found'
      });
    }

    const enrollments = await Enrollment.find({
      department: period.department,
      semester: period.semester,
      isOpen: true
    })
    .populate('student', 'name email')
    .populate('course', 'courseName')
    .populate('department', 'departmentName');

    res.status(200).json({
      success: true,
      count: enrollments.length,
      data: enrollments
    });
  } catch (error) {
    console.error('Error fetching enrollment students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

const getAllStudentAttendance = async (req, res) => {
  try {
    const { courseId, date, studentId } = req.query;
    const filter = {};
    
    if (courseId) filter.course = courseId;
    if (date) filter.date = date;
    if (studentId) filter.student = studentId;

    const attendance = await Attendance.find(filter)
      .populate('student', 'name email')
      .populate('course', 'courseName')
      .sort({ date: -1 });
    
    res.status(200).json({ attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all student marks
const getAllStudentMarks = async (req, res) => {
  try {
    const { courseId, semester, studentId } = req.query;
    const filter = {};
    
    if (courseId) filter.course = courseId;
    if (semester) filter.semester = semester;
    if (studentId) filter.student = studentId;

    const marks = await Marks.find(filter)
      .populate('student', 'name email')
      .populate('course', 'courseName')
      .sort({ semester: 1 });
    
    res.status(200).json({ marks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllPendingEnrollments = async (req, res) => {
  try {   
    // Get all enrollments that are not yet approved
    const enrollments = await Enrollment.find({isApproved: false })
      .populate('student', 'name email department semester')
      .populate('course', 'courseName semester department')
      .populate('department', 'departmentName')  
      .sort({ enrollmentDate: -1 });  

    // Group by course for admin view  
    const groupedEnrollments = enrollments.reduce((acc, enrollment) => {
      const courseId = enrollment.course._id.toString();
      if (!acc[courseId]) {
        acc[courseId] = {   
          courseId: enrollment.course._id,
          courseName: enrollment.course.courseName,
          semester: enrollment.course.semester,
          department: enrollment.department.departmentName,  
          pendingStudents: []
        };
      }   
      
      acc[courseId].pendingStudents.push({
        enrollmentId: enrollment._id,
        studentId: enrollment.student._id,
        studentName: enrollment.student.name,
        studentEmail: enrollment.student.email,
        enrollmentDate: enrollment.enrollmentDate,
        department: enrollment.student.department,
        semester: enrollment.student.semester
      });

      return acc;
    }, {});

    res.status(200).json({
      message: 'Pending enrollments fetched successfully',
      enrollments: Object.values(groupedEnrollments)
    });
  } catch (error) {
    console.error('Error fetching pending enrollments:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};
const approveEnrollment = async (req, res) => {
  const { enrollmentId } = req.body;

  try {
    // Find the enrollment
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('student')
      .populate('course');
      console.log(enrollmentId)

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check if already approved
    if (enrollment.isApproved) {
      return res.status(400).json({ message: 'Enrollment already approved' });
    }

    // Update enrollment status
    enrollment.isApproved = true;
    enrollment.approvedBy = req.user.id;
    enrollment.approvalDate = new Date();
    await enrollment.save();

    // Add student to course's enrolledStudents
    const course = await Course.findById(enrollment.course._id);
    if (!course.enrolledStudents.includes(enrollment.student._id)) {
      course.enrolledStudents.push(enrollment.student._id);
      await course.save();
    }

    res.status(200).json({ 
      message: 'Enrollment approved successfully',
      enrollment 
    });
  } catch (error) {
    console.error('Error approving enrollment:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

const bulkApproveEnrollments = async (req, res) => {
  const { enrollmentIds } = req.body;

  try {
    if (!enrollmentIds || !Array.isArray(enrollmentIds)) {
      return res.status(400).json({ message: 'Invalid enrollment IDs' });
    }

    const results = {
      total: enrollmentIds.length,
      approved: 0,
      failed: 0,
      errors: []
    };

    // Process each enrollment
    await Promise.all(enrollmentIds.map(async (id) => {
      try {
        const enrollment = await Enrollment.findById(id)
          .populate('student')
          .populate('course');

        if (!enrollment) {
          throw new Error('Enrollment not found');
        }

        if (enrollment.isApproved) {
          throw new Error('Already approved');
        }

        // Approve enrollment
        enrollment.isApproved = true;
        enrollment.approvedBy = req.user.id;
        enrollment.approvalDate = new Date();
        await enrollment.save();

        // Add student to course
        const course = await Course.findById(enrollment.course._id);
        if (!course.enrolledStudents.includes(enrollment.student._id)) {
          course.enrolledStudents.push(enrollment.student._id);
          await course.save();
        }

        results.approved++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          enrollmentId: id,
          error: error.message
        });
      }
    }));

    res.status(200).json({
      message: 'Bulk approval completed',
      results
    });
  } catch (error) {
    console.error('Error in bulk approval:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'undergrad' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all attendance (with filters)
const getAllAttendance = async (req, res) => {
  try {
    const { courseId, date, studentId } = req.query;
    const filter = {};
    
    if (courseId) filter.course = courseId;
    if (date) filter.date = new Date(date);
    if (studentId) filter.student = studentId;

    const attendance = await Attendance.find(filter)
      .populate('student', 'name email rollNumber')
      .populate('course', 'courseName courseCode')
      .populate('markedBy', 'name')
      .sort({ date: -1 });
    
    res.status(200).json({ attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance for a specific student
const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const attendance = await Attendance.find({ student: studentId })
      .populate('course', 'courseName courseCode')
      .sort({ date: -1 });
    
    res.status(200).json({ attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update attendance
const updateAttendance = async (req, res) => {
  const { attendanceId } = req.params;
  const { status, classesTaken } = req.body;

  try {
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      { status, classesTaken },
      { new: true }
    ).populate('student course');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.status(200).json({ 
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all marks (with filters)
const getAllMarks = async (req, res) => {
  try {
    const { courseId, semester, studentId } = req.query;
    const filter = {};
    
    if (courseId) filter.course = courseId;
    if (semester) filter.semester = semester;
    if (studentId) filter.student = studentId;

    const marks = await Marks.find(filter)
      .populate('student', 'name email rollNumber')
      .populate('course', 'courseName courseCode')
      .sort({ semester: 1 });
    
    res.status(200).json({ marks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get marks for a specific student
const getStudentMarks = async (req, res) => {
  try {
    const { studentId } = req.params;
    const marks = await Marks.find({ student: studentId })
      .populate('course', 'courseName courseCode')
      .sort({ semester: 1 });
    
    res.status(200).json({ marks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update marks
const updateMarks = async (req, res) => {
  const { marksId } = req.params;
  const { marksObtained, totalMarks } = req.body;

  try {
    const marks = await Marks.findByIdAndUpdate(
      marksId,
      { marksObtained, totalMarks },
      { new: true }
    ).populate('student course');

    if (!marks) {
      return res.status(404).json({ message: 'Marks record not found' });
    }

    res.status(200).json({ 
      message: 'Marks updated successfully',
      marks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


module.exports = { registerUser,editUser,deleteUser,getAllUsers,createCourse,assignCourseToTeacher,createDepartment,getAllStudentsMarks,editMarks ,approveEnrollment,startNewEnrollment,updateSemesterForPassedStudents,editDepartment,editCourse,editAssignedCourse,stopEnrollment,endSemester,getAllAttendance,getAllFeedback,getAllDepartments,getAllCourses,getActiveEnrollments,getEnrollmentStudents, getAllStudentAttendance,
  getAllStudentMarks,getAllPendingEnrollments,bulkApproveEnrollments, getAllAttendance,updateAttendance,getAllMarks, updateMarks,getAllStudents}; 