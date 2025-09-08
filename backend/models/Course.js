const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Course code cannot be more than 10 characters']
  },
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [100, 'Course name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [10, 'Credits cannot be more than 10']
  },
  level: {
    type: String,
    enum: ['undergraduate', 'postgraduate', 'diploma', 'certificate'],
    default: 'undergraduate'
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1, 'Year must be at least 1'],
    max: [5, 'Year cannot be more than 5']
  },
  semester: {
    type: String,
    enum: ['1', '2', 'both'],
    required: [true, 'Semester is required']
  },
  lecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lecturer is required'],
    validate: {
      validator: function(v) {
        return this.model('User').findById(v).then(user => {
          return user && user.role === 'lecturer';
        });
      },
      message: 'Lecturer must be a valid user with lecturer role'
    }
  },
  students: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: function(v) {
          return this.model('User').findById(v).then(user => {
            return user && user.role === 'student';
          });
        },
        message: 'Student must be a valid user with student role'
      }
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'dropped', 'completed'],
      default: 'active'
    },
    grade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F', 'P', 'NP'],
      default: null
    }
  }],
  schedule: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)']
    },
    room: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['lecture', 'tutorial', 'practical', 'lab'],
      default: 'lecture'
    }
  }],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  maxStudents: {
    type: Number,
    default: 50,
    min: [1, 'Maximum students must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  syllabus: {
    type: String,
    maxlength: [2000, 'Syllabus cannot be more than 2000 characters']
  },
  assessment: {
    assignments: {
      weight: { type: Number, default: 30, min: 0, max: 100 },
      count: { type: Number, default: 3, min: 0 }
    },
    midterm: {
      weight: { type: Number, default: 30, min: 0, max: 100 },
      hasExam: { type: Boolean, default: true }
    },
    final: {
      weight: { type: Number, default: 40, min: 0, max: 100 },
      hasExam: { type: Boolean, default: true }
    },
    attendance: {
      weight: { type: Number, default: 10, min: 0, max: 100 },
      required: { type: Number, default: 75, min: 0, max: 100 }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current student count
courseSchema.virtual('currentStudentCount').get(function() {
  return this.students.filter(student => student.status === 'active').length;
});

// Virtual for course status
courseSchema.virtual('status').get(function() {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'completed';
  return 'active';
});

// Virtual for enrollment status
courseSchema.virtual('isEnrollmentOpen').get(function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate && this.currentStudentCount < this.maxStudents;
});

// Index for better query performance
courseSchema.index({ code: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ lecturer: 1 });
courseSchema.index({ year: 1, semester: 1 });
courseSchema.index({ isActive: 1 });

// Pre-save middleware to validate end date
courseSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Pre-save middleware to validate schedule times
courseSchema.pre('save', function(next) {
  for (const session of this.schedule) {
    const start = new Date(`2000-01-01T${session.startTime}`);
    const end = new Date(`2000-01-01T${session.endTime}`);
    if (end <= start) {
      next(new Error('End time must be after start time'));
      return;
    }
  }
  next();
});

// Instance method to add student
courseSchema.methods.addStudent = function(studentId) {
  if (this.currentStudentCount >= this.maxStudents) {
    throw new Error('Course is full');
  }
  
  if (this.students.some(s => s.student.toString() === studentId.toString())) {
    throw new Error('Student is already enrolled');
  }
  
  this.students.push({ student: studentId });
  return this.save();
};

// Instance method to remove student
courseSchema.methods.removeStudent = function(studentId) {
  const studentIndex = this.students.findIndex(s => s.student.toString() === studentId.toString());
  if (studentIndex === -1) {
    throw new Error('Student is not enrolled in this course');
  }
  
  this.students.splice(studentIndex, 1);
  return this.save();
};

// Instance method to get student grade
courseSchema.methods.getStudentGrade = function(studentId) {
  const student = this.students.find(s => s.student.toString() === studentId.toString());
  return student ? student.grade : null;
};

// Static method to find courses by department
courseSchema.statics.findByDepartment = function(department) {
  return this.find({ department: department, isActive: true });
};

// Static method to find courses by lecturer
courseSchema.statics.findByLecturer = function(lecturerId) {
  return this.find({ lecturer: lecturerId, isActive: true });
};

// Static method to find courses by student
courseSchema.statics.findByStudent = function(studentId) {
  return this.find({ 
    'students.student': studentId, 
    'students.status': 'active',
    isActive: true 
  });
};

module.exports = mongoose.model('Course', courseSchema);
