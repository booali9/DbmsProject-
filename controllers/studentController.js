const Enrollment = require('../models/Enrollement'); // Adjust the path as necessary
const Course = require('../models/Course'); // Adjust the path as necessary
const User = require('../models/User'); 
const Marks = require('../models/Mark');
const Department =require("../models/Department") 
const Feedback =require("../models/Feedback")
const Attendance= require("../models/Attendance")
const EnrollmentPeriod=require("../models/Enrollmentperiod")
const mongoose=require("mongoose")

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

      // Convert department to ObjectId if it's a string
      let departmentId = student.department;
      if (typeof student.department === 'string') {
          const department = await Department.findOne({ 
              departmentName: student.department 
          });
          if (!department) {
              return res.status(400).json({ 
                  message: 'Invalid department reference',
                  department: student.department
              });
          }
          departmentId = department._id;
      }

      // Check if enrollment period is open
      const enrollmentPeriod = await EnrollmentPeriod.findOne({ 
          department: departmentId, // Use the converted ObjectId
          isOpen: true,
          endDate: { $gt: new Date() } // Also check date is still valid
      });
      
      if (!enrollmentPeriod) {
          return res.status(400).json({ 
              message: 'No active enrollment period for your department' 
          });
      }

      // Check number of courses
      if (courseIds.length > enrollmentPeriod.maxCourses) {
          return res.status(400).json({ 
              message: `You cannot enroll in more than ${enrollmentPeriod.maxCourses} courses`
          });
      }

      // Get failed courses and current semester courses in parallel
      const [failedCourses, currentSemesterCourses] = await Promise.all([
          Marks.find({
              student: studentId,
              marksObtained: { $lt: 50 }
          }).populate('course'),
          Course.find({
              department: departmentId, // Use the converted ObjectId
              semester: student.semester
          })
      ]);

      // Combine current semester courses with failed courses
      const availableCourses = [...currentSemesterCourses];
      failedCourses.forEach(failed => {
          if (failed.course && !availableCourses.some(c => c._id.equals(failed.course._id))) {
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
              department: departmentId, // Use the converted ObjectId
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
          failedCourses: failedCourses.map(f => f.course?.courseName).filter(Boolean)
      });
  } catch (error) {
      console.error('Error enrolling in courses:', error);
      res.status(500).json({ 
          message: 'Server error', 
          error: error.message,
          ...(process.env.NODE_ENV === 'development' && {
              stack: error.stack
          })
      });
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
  try {
      // 1. Verify request and user ID
      if (!req.user) {
          console.error('No user object in request');
          return res.status(401).json({ message: 'Unauthorized' });
      }

      const studentId = req.user.id;
      console.log('Student ID from token:', studentId);

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
          return res.status(400).json({ 
              message: 'Invalid student ID format',
              receivedId: studentId
          });
      }

      // 2. Find student
      const student = await User.findById(studentId)
          .select('department semester')
          .lean();
      
      if (!student) {
          return res.status(404).json({ message: 'Student not found' });
      }

      // 3. Validate student data
      if (!student.department || !student.semester) {
          return res.status(400).json({
              message: 'Student missing department or semester information'
          });
      }

      // 4. Check if department is already an ObjectId
      let departmentId = student.department;
      if (typeof student.department === 'string') {
          // Find department by name to get its ID
          const department = await Department.findOne({ 
              departmentName: student.department 
          });
          
          if (!department) {
              return res.status(400).json({
                  message: 'Invalid department reference',
                  department: student.department
              });
          }
          departmentId = department._id;
      }

      // 5. Find courses with proper department ID
      const courses = await Course.find({
          department: departmentId,
          semester: student.semester
      }).lean();

      return res.status(200).json({ 
          message: 'Courses fetched successfully',
          courses
      });

  } catch (error) {
      console.error('Error in getCoursesForStudent:', error);
      return res.status(500).json({
          message: 'Server error',
          error: error.message,
          ...(process.env.NODE_ENV === 'development' && {
              stack: error.stack
          })
      });
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
                    courseName: enrollment.course.courseName,
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
    
    const studentId =req.user.id;
     // Student ID from the token

     console.log(studentId)
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
  const studentId = req.user?.id;

  try {
      const student = await User.findById(studentId);
      if (!student) {
          return res.status(404).json({ message: 'Student not found' });
      }

      // Convert department to ObjectId if it's a string
      let departmentId = student.department;
      if (typeof student.department === 'string') {
          const department = await Department.findOne({ 
              departmentName: student.department 
          });
          if (!department) {
              return res.status(400).json({ 
                  message: 'Invalid department reference',
                  department: student.department
              });
          }
          departmentId = department._id;
      }

      // Check if enrollment period is open
      const enrollmentPeriod = await EnrollmentPeriod.findOne({ 
          department: departmentId,  // Use the converted ObjectId
          isOpen: true,
          endDate: { $gt: new Date() } // Also check date is still valid
      });
      
      if (!enrollmentPeriod) {
          return res.status(200).json({ 
              message: 'No active enrollment period', 
              courses: [],
              isEnrollmentOpen: false
          });
      }

      // Get failed courses and current semester courses in parallel
      const [failedCourses, currentSemesterCourses] = await Promise.all([
          Marks.find({
              student: studentId,
              marksObtained: { $lt: 50 }
          }).populate('course'),
          Course.find({
              department: departmentId,  // Use the converted ObjectId
              semester: student.semester
          })
      ]);

      // Combine and remove duplicates
      const availableCourses = [...currentSemesterCourses];
      failedCourses.forEach(failed => {
          if (failed.course && !availableCourses.some(c => c._id.equals(failed.course._id))) {
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
      res.status(500).json({ 
          message: 'Server error', 
          error: error.message,
          ...(process.env.NODE_ENV === 'development' && {
              stack: error.stack
          })
      });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ student: req.user.id })
      .populate('course', 'courseName')
      .sort({ date: -1 });
    
    res.status(200).json({ attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get student's own marks
const getMyMarks = async (req, res) => {
  try {
    const marks = await Marks.find({ student: req.user.id })
      .populate('course', 'courseName')
      .sort({ semester: 1 });
    
    res.status(200).json({ marks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


  module.exports={enrollStudentInCourse,getStudentMarks,getCoursesForStudent,getAllEnrollmentsForAdmin,getStudentAttendance,submitFeedback,enrollInCourses,getAvailableCourses,getMyMarks ,getMyAttendance}