const Enrollment = require('../models/Enrollement'); // Adjust the path as necessary
const Course = require('../models/Course'); // Adjust the path as necessary
const User = require('../models/User'); 
const Marks = require('../models/Mark');
const Department =require("../models/Department") 
const Feedback =require("../models/Feedback")
const Attendance= require("../models/Attendance")

const enrollStudentInCourse = async (req, res) => {
    const { student, course, semester, department } = req.body; // Courses is now an array

    try {
        // Validate student
        const studentUser = await User.findById(student);
        if (!studentUser || (studentUser.role !== 'undergrad' && studentUser.role !== 'postgrad')) {
            return res.status(400).json({ message: 'Invalid student ID or not a student' });
        }

        // Validate department
        const departmentExists = await Department.findById(department);
        if (!departmentExists) {
            return res.status(400).json({ message: 'Invalid department ID' });
        }

        // Validate each course
        const enrolledCourses = [];
        for (const courses of course) {
            const courseExists = await Course.findById(courses);
            if (!courseExists) {
                return res.status(400).json({ message: `Invalid course ID: ${courses}` });
            }
            if (courseExists.semester !== semester) {
                return res.status(400).json({ message: `Course ${courses} does not match the student's semester` });
            }

            // Check if the student is already enrolled in this course
            const existingEnrollment = await Enrollment.findOne({ student, course, semester });
            if (existingEnrollment) {
                return res.status(400).json({ message: `Student is already enrolled in course ${course}` });
            }

            // Create enrollment for this course
            const newEnrollment = new Enrollment({
                student,
                course,
                semester,
                department,
                enrollmentDate: new Date(),
                isApproved: false, // Admin must approve it
                isOpen: true, // Track active enrollments
            });
 
            await newEnrollment.save();
            enrolledCourses.push(newEnrollment);
        }

        res.status(201).json({ message: 'Student enrolled in multiple courses successfully', enrollments: enrolledCourses });

    } catch (error) {
        console.error(`Error enrolling student: ${error.message}`);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Student enrolls in courses
const enrollInCourses = async (req, res) => {
    const { courseIds } = req.body;
    const studentId = req.user.id;
  
    try {
      // Get student info
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      // Check if enrollment period is open
      const enrollmentPeriod = await EnrollmentPeriod.findOne({ 
        department: student.department,
        isOpen: true
      });
      
      if (!enrollmentPeriod) {
        return res.status(400).json({ message: 'No active enrollment period for your department' });
      }
  
      // Check if current date is before end date
      if (new Date() > enrollmentPeriod.endDate) {
        return res.status(400).json({ message: 'Enrollment period has ended' });
      }
  
      // Check number of courses
      if (courseIds.length > enrollmentPeriod.maxCourses) {
        return res.status(400).json({ 
          message: `You cannot enroll in more than ${enrollmentPeriod.maxCourses} courses` 
        });
      }
  
      // Check failed courses from previous semesters
      const failedCourses = await Marks.find({
        student: studentId,
        marksObtained: { $lt: 50 } // Assuming passing mark is 50
      }).populate('course');
  
      // Get current semester courses
      const currentSemesterCourses = await Course.find({
        department: student.department,
        semester: student.semester
      });
  
      // Combine current semester courses with failed courses
      const availableCourses = [...currentSemesterCourses];
      failedCourses.forEach(failed => {
        if (!availableCourses.some(c => c._id.equals(failed.course._id))) {
          availableCourses.push(failed.course);
        }
      });
  
      // Validate each course
      const enrollments = [];
      for (const courseId of courseIds) {
        const course = availableCourses.find(c => c._id.equals(courseId));
        if (!course) {
          return res.status(400).json({ 
            message: `Course ${courseId} is not available for enrollment` 
          });
        }
  
        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          student: studentId,
          course: courseId,
          isOpen: true
        });
        
        if (existingEnrollment) {
          return res.status(400).json({ 
            message: `You are already enrolled in course ${course.courseName}` 
          });
        }
  
        // Create enrollment
        const newEnrollment = new Enrollment({
          student: studentId,
          course: courseId,
          semester: course.semester,
          department: student.department,
          enrollmentDate: new Date(),
          isApproved: false,
          isOpen: true
        });
  
        await newEnrollment.save();
        enrollments.push(newEnrollment);
      }
  
      res.status(201).json({ 
        message: 'Enrollment successful', 
        enrollments,
        failedCourses: failedCourses.map(f => f.course.courseName)
      });
    } catch (error) {
      console.error('Error enrolling in courses:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
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

const getAllEnrollmentsForAdmin = async (req, res) => {
    try {
        const enrollments = await Enrollment.find().populate('student').populate('course');

        if (!enrollments.length) {
            return res.status(404).json({ message: 'No enrollments found' });
        }

        // Group courses by course ID and list students under each
        const courseEnrollments = {};

        enrollments.forEach(enrollment => {
            const courseId = enrollment.course._id.toString();
            if (!courseEnrollments[courseId]) {
                courseEnrollments[courseId] = {
                    courseId: enrollment.course._id,
                    courseName: enrollment.course.name,
                    students: [],
                };
            }
            courseEnrollments[courseId].students.push({
                studentId: enrollment.student._id,
                studentName: enrollment.student.name,
                studentEmail: enrollment.student.email,
                semester: enrollment.semester,
            });
        });

        res.status(200).json({ message: 'All enrollments fetched successfully', courses: Object.values(courseEnrollments) });
    } catch (error) {
        console.error('Error fetching enrollments for admin:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getStudentAttendance = async (req, res) => {
    const studentId = req.user.id; // Student ID from the token

    try {
        // Fetch attendance records for the student
        const attendance = await Attendance.find({ student: studentId }).populate('course', 'courseName');

        if (!attendance || attendance.length === 0) {
            return res.status(404).json({ message: 'No attendance records found' });
        }

        // Format the response
        const response = attendance.map(record => ({
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

const submitFeedback = async (req, res) => {
    const { courseId, feedback } = req.body;
    const studentId = req.user.id; // Student ID from the token

    try {
        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if the student is enrolled in the course
        const isEnrolled = await Enrollment.findOne({ student: studentId, course: courseId });
        if (!isEnrolled) {
            return res.status(400).json({ message: 'You are not enrolled in this course' });
        }

        // Create a new feedback record
        const newFeedback = new Feedback({
            student: studentId,
            teacher: course.teacher,
            course: courseId,
            semester: course.semester,
            feedback,
        });

        await newFeedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
    } catch (error) {
        console.error('Error submitting feedback:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAvailableCourses = async (req, res) => {
    const studentId = req.user.id;
  
    try {
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
  
      // Check if enrollment period is open
      const enrollmentPeriod = await EnrollmentPeriod.findOne({ 
        department: student.department,
        isOpen: true
      });
      
      if (!enrollmentPeriod) {
        return res.status(200).json({ 
          message: 'No active enrollment period', 
          courses: [],
          isEnrollmentOpen: false
        });
      }
  
      // Get failed courses
      const failedCourses = await Marks.find({
        student: studentId,
        marksObtained: { $lt: 50 }
      }).populate('course');
  
      // Get current semester courses
      const currentSemesterCourses = await Course.find({
        department: student.department,
        semester: student.semester
      });
  
      // Combine and remove duplicates
      const availableCourses = [...currentSemesterCourses];
      failedCourses.forEach(failed => {
        if (!availableCourses.some(c => c._id.equals(failed.course._id))) {
          availableCourses.push(failed.course);
        }
      });
  
      res.status(200).json({ 
        message: 'Available courses fetched',
        courses: availableCourses,
        isEnrollmentOpen: true,
        maxCourses: enrollmentPeriod.maxCourses
      });
    } catch (error) {
      console.error('Error fetching available courses:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  



  module.exports={enrollStudentInCourse,getStudentMarks,getCoursesForStudent,getCoursesForStudent,getAllEnrollmentsForAdmin,getStudentAttendance,submitFeedback,enrollInCourses,getAvailableCourses}