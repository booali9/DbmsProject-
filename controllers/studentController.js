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



  module.exports={enrollStudentInCourse,getStudentMarks,enrollInCourse,getCoursesForStudent,getCoursesForStudent,getAllEnrollmentsForAdmin,getStudentAttendance,submitFeedback}