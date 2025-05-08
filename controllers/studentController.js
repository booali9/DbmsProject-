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
    const session = await mongoose.startSession();
    session.startTransaction();
  
    try {
      const { courseIds } = req.body;
      const studentId = req.user.id;
  
      // 1. Validate input
      if (!Array.isArray(courseIds)) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Invalid course selection' });
      }
  
      // 2. Get student with department
      const student = await User.findById(studentId).session(session);
      if (!student) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Student not found' });
      }
  
      // 3. Get department (handle both ObjectId and string)
      let department = student.department;
      if (typeof student.department === 'string') {
        department = await Department.findOne({ 
          departmentName: student.department 
        }).session(session);
        if (!department) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Invalid department' });
        }
      }
  
      // 4. Check enrollment period
      const enrollmentPeriod = await EnrollmentPeriod.findOne({
        department: department._id,
        isOpen: true,
        endDate: { $gt: new Date() }
      }).session(session);
  
      if (!enrollmentPeriod) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'No active enrollment period' });
      }
  
      // 5. Get available semester 1 courses
      const availableCourses = await Course.find({
        department: department._id,
        semester: 1
      }).session(session);
  
      // 6. Process each course enrollment
      const enrollments = [];
      for (const courseId of courseIds) {
        // Validate course ID
        if (!mongoose.Types.ObjectId.isValid(courseId)) {
          await session.abortTransaction();
          return res.status(400).json({ message: `Invalid course ID` });
        }
  
        // Find available course
        const course = availableCourses.find(c => c._id.equals(courseId));
        if (!course) {
          await session.abortTransaction();
          return res.status(400).json({ message: 'Course not available' });
        }
  
        // Check for existing enrollment (VERY IMPORTANT)
        const existing = await Enrollment.findOne({
          student: studentId,
          course: courseId,
          isActive: true,
          status: { $in: ["pending", "approved"] }
        }).session(session);
  
        if (existing) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: `Already enrolled in ${course.courseName}`,
            existingCourse: existing.course 
          });
        }
  
        // Create new enrollment
        const newEnrollment = new Enrollment({
          student: studentId,
          course: courseId,
          semester: 1,
          department: department._id,
          enrollmentPeriod: enrollmentPeriod._id,
          status: 'pending',
          isActive: true
        });
  
        await newEnrollment.save({ session });
        enrollments.push(newEnrollment);
      }
  
      await session.commitTransaction();
      res.status(201).json({ 
        success: true,
        message: 'Enrolled successfully',
        enrollments 
      });
  
    } catch (error) {
      await session.abortTransaction();
      
      // Enhanced duplicate key error handling
      if (error.code === 11000) {
        // Find the actual conflicting enrollment
        const conflict = await Enrollment.findOne({
          student: req.user.id,
          isActive: true,
          status: { $in: ["pending", "approved"] }
        });
        
        return res.status(409).json({
          message: 'Duplicate enrollment detected',
          conflictingCourse: conflict?.course,
          attemptedCourses: req.body.courseIds,
          solution: conflict ? 
            `You're already enrolled in course ${conflict.course}` : 
            'Unknown conflict - please check your enrollments'
        });
      }
  
      res.status(500).json({
        message: 'Enrollment failed',
        error: error.message
      });
    } finally {
      session.endSession();
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

const getStudentAttendance = async (req, res) => {
    try {
      const attendance = await Attendance.find({ student: req.user.id })
        .populate('course', 'courseName department')
        .sort({ date: -1 });
  
      res.status(200).json({ attendance });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  const getStudentMarks = async (req, res) => {
    try {
      const marks = await Marks.find({ student: req.user.id })
        .populate('course', 'courseName department')
        .sort({ semester: 1 });
  
      res.status(200).json({ marks });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  // Get enrolled courses with marks and attendance
const getEnrolledCoursesWithDetails = async (req, res) => {
    try {
      const studentId = req.user.id;
      
      // Get all enrollments
      const enrollments = await Enrollment.find({ 
        student: studentId,
        isApproved: true 
      }).populate('course', 'courseName department semester');
      
      // Get marks and attendance in parallel
      const [marks, attendance] = await Promise.all([
        Marks.find({ student: studentId }).populate('course'),
        Attendance.find({ student: studentId }).populate('course')
      ]);
      
      // Combine data
      const courses = enrollments.map(enrollment => {
        const courseMarks = marks.filter(m => m.course._id.equals(enrollment.course._id));
        const courseAttendance = attendance.filter(a => a.course._id.equals(enrollment.course._id));
        
        return {
          ...enrollment.course.toObject(),
          marks: courseMarks,
          attendance: courseAttendance,
          enrollmentDate: enrollment.enrollmentDate
        };
      });
      
      res.status(200).json({ courses });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  // Check semester progression eligibility
  const checkSemesterProgression = async (req, res) => {
    try {
      const studentId = req.user.id;
      const student = await User.findById(studentId);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Get current semester marks
      const marks = await Marks.find({ 
        student: studentId,
        semester: student.semester 
      });
      
      // Count passed courses (assuming passing mark is 50)
      const passedCourses = marks.filter(mark => mark.marksObtained >= 50).length;
      const totalCourses = marks.length;
      const canProgress = passedCourses >= 3;
      
      res.status(200).json({
        canProgress,
        passedCourses,
        totalCourses,
        currentSemester: student.semester,
        requiredToPass: 3
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };
  
  // Update semester if eligible
  const updateSemester = async (req, res) => {
    try {
      const studentId = req.user.id;
      const student = await User.findById(studentId);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Check eligibility
      const marks = await Marks.find({ 
        student: studentId,
        semester: student.semester 
      });
      
      const passedCourses = marks.filter(mark => mark.marksObtained >= 50).length;
      
      if (passedCourses < 3) {
        return res.status(400).json({ 
          message: `You need to pass at least 3 courses. Currently passed: ${passedCourses}`
        });
      }
      
      // Update semester
      student.semester += 1;
      await student.save();
      
      res.status(200).json({
        message: 'Semester updated successfully',
        newSemester: student.semester
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };


  module.exports={enrollStudentInCourse,getStudentMarks,getCoursesForStudent,getAllEnrollmentsForAdmin,submitFeedback,enrollInCourses,getAvailableCourses,getMyMarks ,getMyAttendance,getStudentAttendance,
    getStudentMarks,updateSemester,getEnrolledCoursesWithDetails,checkSemesterProgression}