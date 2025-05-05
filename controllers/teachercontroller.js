const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Mark');
const Enrollment=require("../models/Enrollement")

const getAssignedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user.id })
      .populate('department', 'departmentName')
      .populate('enrolledStudents', 'name email studentId') // Include all student fields you need
      .select('courseName department semester section enrolledStudents');

    const updatedCourses = courses.map(course => ({
      _id: course._id,
      courseName: course.courseName,
      department: course.department,
      semester: course.semester,
      section: course.section,
      enrolledStudents: course.enrolledStudents, // This now contains all populated student data
      numberOfStudents: course.enrolledStudents.length
    }));

    res.status(200).json({ courses: updatedCourses });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark attendance for a course (updated from your existing code)
const markAttendance = async (req, res) => {
  const { courseId, date, students, classesTaken } = req.body;
  
  try {
    const course = await Course.findOne({ 
      _id: courseId, 
      teacher: req.user.id 
    });
    
    if (!course) {
      return res.status(403).json({ message: 'Not authorized for this course' });
    }

    const attendanceRecords = await Promise.all(
      students.map(async student => {
        const isEnrolled = await Enrollment.exists({
          student: student.studentId,
          course: courseId
        });
        
        if (!isEnrolled) {
          throw new Error(`Student ${student.studentId} not enrolled`);
        }

        return Attendance.findOneAndUpdate(
          { student: student.studentId, course: courseId, date },
          { 
            status: student.status,
            classesTaken,
            markedBy: req.user.id
          },
          { upsert: true, new: true }
        ).populate('student', 'name');
      })
    );

    res.status(200).json({ 
      message: 'Attendance marked successfully',
      attendance: attendanceRecords
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// Get attendance for a specific course
const getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify teacher is assigned to course
    const isAssigned = await Course.exists({
      _id: courseId,
      teacher: req.user.id
    });
    
    if (!isAssigned) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const attendance = await Attendance.find({ course: courseId })
      .populate('student', 'name email')
      .sort({ date: -1 });

    res.status(200).json({ attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign marks to students (updated from your existing code)
const assignMarks = async (req, res) => {
  const { courseId, studentId, marksObtained, totalMarks, semester } = req.body;
  
  try {
    // Verify teacher is assigned to course
    const isAssigned = await Course.exists({
      _id: courseId,
      teacher: req.user.id
    });
    
    if (!isAssigned) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Verify student is enrolled
    const isEnrolled = await Enrollment.exists({
      student: studentId,
      course: courseId
    });
    
    if (!isEnrolled) {
      return res.status(400).json({ message: 'Student not enrolled' });
    }

    // Create or update marks
    const marks = await Marks.findOneAndUpdate(
      { student: studentId, course: courseId, semester },
      { marksObtained, totalMarks },
      { upsert: true, new: true }
    ).populate('student', 'name');

    res.status(200).json({ marks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get marks for a specific course
// Get marks for a specific course
const getCourseMarks = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify teacher is assigned to course
    const isAssigned = await Course.exists({
      _id: courseId,
      teacher: req.user.id
    });
    
    if (!isAssigned) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const marks = await Marks.find({ course: courseId })
      .populate('student', 'name email')
      .sort({ semester: 1 });

    res.status(200).json({ 
      success: true,
      marks // Make sure this matches what your frontend expects
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};
module.exports = {
  getAssignedCourses,
  markAttendance,
  getCourseAttendance,
  assignMarks,
  getCourseMarks
};