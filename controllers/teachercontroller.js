const Enrollment = require('../models/Enrollement'); // Adjust the path as necessary
const Course = require('../models/Course'); 
const User = require('../models/User');
const Marks = require('../models/Mark'); // Import the Marks model

const assignMarksToStudent = async (req, res) => {
    const { enrollmentId, marksObtained, totalMarks, semester } = req.body;
    const teacherId = req.user.id; // Teacher ID from the token
  
    try {
      // Check if the enrollment exists
      const enrollmentExists = await Enrollment.findById(enrollmentId).populate('course');
      if (!enrollmentExists) {
        return res.status(400).json({ message: 'Invalid enrollment ID' });
      }
  
      // Check if the teacher is assigned to the course
      const course = await Course.findById(enrollmentExists.course._id);
      if (!course || course.teacher.toString() !== teacherId.toString()) {
        return res.status(403).json({ message: 'You are not assigned to this course' });
      }
  
      // Create a new Marks entry
      const newMarks = new Marks({
        student: enrollmentExists.student,
        course: enrollmentExists.course._id,
        semester: semester,
        marksObtained: marksObtained,
        totalMarks: totalMarks
      });
  
      // Save the marks to the database
      await newMarks.save();
  
      res.status(200).json({ message: 'Marks assigned successfully', marks: newMarks });
    } catch (error) {
      console.error('Error assigning marks:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};
const markAttendance = async (req, res) => {
  const { courseId, date, students } = req.body; // students: [{ studentId, status }]
  const teacherId = req.user.id; // Teacher ID from the token

  try {
      // Check if the course exists and is assigned to the teacher
      const course = await Course.findById(courseId);
      if (!course || course.teacher.toString() !== teacherId) {
          return res.status(403).json({ message: 'You are not assigned to this course' });
      }

      // Validate each student
      for (const student of students) {
          const studentExists = await User.findById(student.studentId);
          if (!studentExists || !['undergrad', 'postgrad'].includes(studentExists.role)) {
              return res.status(400).json({ message: `Invalid student ID: ${student.studentId}` });
          }

          // Check if the student is enrolled in the course
          const isEnrolled = await Enrollment.findOne({ student: student.studentId, course: courseId });
          if (!isEnrolled) {
              return res.status(400).json({ message: `Student ${student.studentId} is not enrolled in this course` });
          }
      }

      // Save attendance for each student
      const attendanceRecords = [];
      for (const student of students) {
          const newAttendance = new Attendance({
              student: student.studentId,
              course: courseId,
              date,
              status: student.status,
          });
          await newAttendance.save();
          attendanceRecords.push(newAttendance);
      }

      res.status(201).json({ message: 'Attendance marked successfully', attendance: attendanceRecords });
  } catch (error) {
      console.error('Error marking attendance:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getTeacherCourseAttendance = async (req, res) => {
  const teacherId = req.user.id; // Teacher ID from the token

  try {
      // Fetch all courses assigned to the teacher
      const courses = await Course.find({ teacher: teacherId }).select('_id courseName');

      if (!courses || courses.length === 0) {
          return res.status(404).json({ message: 'No courses found for this teacher' });
      }

      // Fetch attendance for students enrolled in these courses
      const attendance = await Attendance.find({ course: { $in: courses.map(course => course._id) } })
          .populate('student', 'name email')
          .populate('course', 'courseName');

      if (!attendance || attendance.length === 0) {
          return res.status(404).json({ message: 'No attendance records found for your courses' });
      }

      // Format the response
      const response = attendance.map(record => ({
          studentName: record.student.name,
          studentEmail: record.student.email,
          courseName: record.course.courseName,
          date: record.date,
          status: record.status,
      }));

      res.status(200).json({ message: 'Attendance fetched successfully', attendance: response });
  } catch (error) {
      console.error('Error fetching attendance:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
  }
};
  module.exports={assignMarksToStudent,markAttendance,getTeacherCourseAttendance}