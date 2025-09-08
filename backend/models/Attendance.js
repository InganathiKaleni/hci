const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: true,
    default: 'present'
  },
  notes: {
    type: String,
    maxlength: 200,
    trim: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  qrSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QR',
    required: false
  }
}, {
  timestamps: true
});

// Compound index to ensure unique attendance records per student, course, and date
attendanceSchema.index({ studentId: 1, courseId: 1, date: 1 }, { unique: true });

// Index for efficient querying
attendanceSchema.index({ courseId: 1, date: 1 });
attendanceSchema.index({ studentId: 1, date: 1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ createdAt: 1 });

// Virtual for attendance rate calculation
attendanceSchema.virtual('isPresent').get(function() {
  return this.status === 'present';
});

// Instance method to update attendance status
attendanceSchema.methods.updateStatus = function(newStatus, notes = null) {
  this.status = newStatus;
  if (notes !== null) {
    this.notes = notes;
  }
  this.updatedAt = new Date();
  return this.save();
};

// Static method to get attendance statistics for a course
attendanceSchema.statics.getCourseStats = async function(courseId, startDate, endDate) {
  const matchStage = { courseId };
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  result.attendanceRate = result.total > 0 ? (result.present / result.total) * 100 : 0;

  return result;
};

// Static method to get student attendance statistics
attendanceSchema.statics.getStudentStats = async function(studentId, startDate, endDate) {
  const matchStage = { studentId };
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  result.attendanceRate = result.total > 0 ? (result.present / result.total) * 100 : 0;

  return result;
};

// Static method to get attendance by date range
attendanceSchema.statics.getByDateRange = async function(courseId, startDate, endDate) {
  return await this.find({
    courseId,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
  .populate('studentId', 'name studentId')
  .populate('courseId', 'name code')
  .sort({ date: -1, createdAt: -1 });
};

// Pre-save middleware to validate data
attendanceSchema.pre('save', function(next) {
  // Ensure date is set to start of day for consistent comparison
  if (this.date) {
    this.date.setHours(0, 0, 0, 0);
  }
  next();
});

// Pre-update middleware
attendanceSchema.pre('findOneAndUpdate', function(next) {
  // Ensure date is set to start of day for consistent comparison
  if (this._update.date) {
    this._update.date.setHours(0, 0, 0, 0);
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
