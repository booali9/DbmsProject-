const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true // Added index for faster queries
  },
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Course", 
    required: true,
    index: true // Added index for faster queries
  },
  department: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Department", 
    required: true 
  },
  semester: { 
    type: Number, 
    required: true,
    min: 1, // Minimum semester validation
    max: 10 // Maximum semester validation
  },
  enrollmentDate: { 
    type: Date, 
    default: Date.now,
    immutable: true // Prevent modification after creation
  },
  isApproved: { 
    type: Boolean, 
    default: false 
  },
  approvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  approvalDate: { 
    type: Date 
  },
  isRejected: { 
    type: Boolean, 
    default: false 
  },
  rejectedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  rejectionDate: { 
    type: Date 
  },
  rejectionReason: { 
    type: String,
    trim: true
  },
  enrollmentPeriod: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "EnrollmentPeriod" 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waitlisted'],
    default: 'pending'
  },
  isActive: { 
    type: Boolean, 
    default: true // For soft deletion
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true }, // Include virtuals when converted to JSON
  toObject: { virtuals: true }
});

// Add compound index for student-course-semester uniqueness
enrollmentSchema.index(
  { student: 1, course: 1, semester: 1 }, 
  { unique: true, partialFilterExpression: { isActive: true } }
);

// Virtual for formatted enrollment date
enrollmentSchema.virtual('formattedEnrollmentDate').get(function() {
  return this.enrollmentDate.toLocaleDateString();
});

// Pre-save hook to update status based on approval/rejection
enrollmentSchema.pre('save', function(next) {
  if (this.isApproved && !this.approvalDate) {
    this.status = 'approved';
    this.approvalDate = new Date();
  } else if (this.isRejected && !this.rejectionDate) {
    this.status = 'rejected';
    this.rejectionDate = new Date();
  }
  next();
});

// Query helper for active enrollments
enrollmentSchema.query.active = function() {
  return this.where({ isActive: true });
};

// Static method to get enrollments by status
enrollmentSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('student course');
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
