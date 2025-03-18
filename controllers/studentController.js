const Enrollment = require('../models/Enrollement'); // Adjust the path as necessary
const Course = require('../models/Course'); // Adjust the path as necessary
const User = require('../models/User'); 
const Marks = require('../models/Mark'); 

const enrollStudentInCourse = async (enrollmentData) => {
    const { student, course, semester } = enrollmentData;
  
    try {
      // Check if the student exists and is a student
      const studentUser = await User.findById(student);
      if (!studentUser || (studentUser.role !== 'undergrad' && studentUser.role !== 'postgrad')) {
        throw new Error('Invalid student ID or not a student');
      }
  
      // Check if the course exists and matches the student's semester
      const courseExists = await Course.findById(course);
      if (!courseExists) {
        throw new Error('Invalid course ID');
      }
      if (courseExists.semester !== semester) {
        throw new Error('Course does not match the student\'s semester');
      }
  
      // Create the enrollment
      const newEnrollment = new Enrollment({
        student,
        course,
        semester,
      });
  
      await newEnrollment.save();
      return newEnrollment;
    } catch (error) {
      throw new Error(`Error enrolling student: ${error.message}`);
    }
  };

  const getStudentMarks = async (req, res) => {
    const studentId = req.user.id; // Assuming the student's ID is available in the token

    try {
        // Fetch all enrollments for the student
        const enrollments = await Enrollment.find({ student: studentId }).populate('course');

        if (!enrollments || enrollments.length === 0) {
            return res.status(404).json({ message: 'No enrollments found for this student' });
        }

        // Fetch marks for all courses the student is enrolled in
        const marks = await Marks.find({ student: studentId }).populate('course');

        if (!marks || marks.length === 0) {
            return res.status(404).json({ message: 'No marks found for this student' });
        }

        // Format the response to show course details and marks
        const response = marks.map(mark => ({
            courseName: mark.course.name, // Assuming the Course schema has a `name` field
            courseCode: mark.course.code, // Assuming the Course schema has a `code` field
            semester: mark.semester,
            marksObtained: mark.marksObtained,
            totalMarks: mark.totalMarks
        }));

        res.status(200).json({ message: 'Marks fetched successfully', marks: response });
    } catch (error) {
        console.error('Error fetching student marks:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const enrollInCourse = async (req, res) => {
    const { courseId } = req.body;
    const studentId = req.user.id; // Student ID from the token

    try {
        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if the student is already enrolled in the course
        const existingEnrollment = await Enrollment.findOne({ student: studentId, course: courseId });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'Student is already enrolled in this course' });
        }

        // Create a new enrollment record
        const newEnrollment = new Enrollment({
            student: studentId,
            course: courseId,
            semester: course.semester,
            enrollmentDate: new Date(),
            isApproved: false, // Initially not approved
        });

        await newEnrollment.save();
        res.status(201).json({ message: 'Enrollment request submitted successfully', enrollment: newEnrollment });
    } catch (error) {
        console.error('Error enrolling in course:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getCoursesForStudent = async (req, res) => {
    const studentId = req.user.id; // Student ID from the token

    try {
        // Fetch the student's details
        const student = await User.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Fetch courses for the student's department and semester
        const courses = await Course.find({
            department: student.department,
            semester: student.semester,
        });

        res.status(200).json({ message: 'Courses fetched successfully', courses });
    } catch (error) {
        console.error('Error fetching courses:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


  module.exports={enrollStudentInCourse,getStudentMarks,enrollInCourse,getCoursesForStudent}