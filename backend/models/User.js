const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'lecturer', 'student'],
    required: [true, 'Role is required'],
    default: 'student'
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values for non-students
    validate: {
      validator: function(v) {
        // Only require studentId for students
        if (this.role === 'student') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Student ID is required for students'
    }
  },
  lecturerId: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        if (this.role === 'lecturer') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Lecturer ID is required for lecturers'
    }
  },
  department: {
    type: String,
    required: function() {
      return this.role === 'student' || this.role === 'lecturer';
    }
  },
  course: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  },
  year: {
    type: String,
    required: function() {
      return this.role === 'student';
    }
  },
  phone: {
    type: String,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    maxlength: [200, 'Address cannot be more than 200 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    language: {
      type: String,
      enum: ['en', 'xh', 'st', 'tn'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'Africa/Johannesburg'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      attendance: { type: Boolean, default: true },
      courses: { type: Boolean, default: true },
      deadlines: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for role display name
userSchema.virtual('roleDisplay').get(function() {
  const roleNames = {
    admin: 'Administrator',
    lecturer: 'Lecturer',
    student: 'Student'
  };
  return roleNames[this.role] || this.role;
});

// Index for better query performance
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find users by role
userSchema.statics.findByRole = function(role) {
  return this.find({ role: role, isActive: true });
};

module.exports = mongoose.model('User', userSchema);
