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


  module.exports={assignMarksToStudent}