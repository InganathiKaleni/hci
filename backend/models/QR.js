const mongoose = require('mongoose');

const qrSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  notes: {
    type: String,
    maxlength: 200,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    required: true
  },
  qrCodeData: {
    type: String,
    required: true
  },
  scannedCount: {
    type: Number,
    default: 0
  },
  lastScannedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
qrSchema.index({ courseId: 1, status: 1 });
qrSchema.index({ createdBy: 1 });
qrSchema.index({ expiresAt: 1 });
qrSchema.index({ status: 1, expiresAt: 1 });
qrSchema.index({ createdAt: 1 });

// Virtual for checking if session is expired
qrSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Virtual for checking if session is active
qrSchema.virtual('isActive').get(function() {
  return this.status === 'active' && !this.isExpired;
});

// Virtual for time remaining
qrSchema.virtual('timeRemaining').get(function() {
  if (this.isExpired) return 0;
  return Math.max(0, this.expiresAt.getTime() - new Date().getTime());
});

// Instance method to expire session
qrSchema.methods.expire = function() {
  this.status = 'expired';
  this.expiresAt = new Date();
  return this.save();
};

// Instance method to cancel session
qrSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Instance method to record scan
qrSchema.methods.recordScan = function() {
  this.scannedCount += 1;
  this.lastScannedAt = new Date();
  return this.save();
};

// Static method to get active sessions for a course
qrSchema.statics.getActiveForCourse = async function(courseId) {
  return await this.find({
    courseId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to get active sessions created by a user
qrSchema.statics.getActiveByUser = async function(userId) {
  return await this.find({
    createdBy: userId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to get expired sessions
qrSchema.statics.getExpired = async function() {
  return await this.find({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { status: 'expired' }
    ]
  }).sort({ expiresAt: -1 });
};

// Static method to get session statistics
qrSchema.statics.getStats = async function(courseId = null, userId = null) {
  const matchStage = {};
  
  if (courseId) matchStage.courseId = courseId;
  if (userId) matchStage.createdBy = userId;

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalScans: { $sum: '$scannedCount' }
      }
    }
  ]);

  const result = {
    active: 0,
    expired: 0,
    cancelled: 0,
    total: 0,
    totalScans: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.total += stat.count;
    result.totalScans += stat.totalScans;
  });

  return result;
};

// Pre-save middleware to validate data
qrSchema.pre('save', function(next) {
  // Auto-expire if past expiration date
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'expired';
  }
  next();
});

// Pre-update middleware
qrSchema.pre('findOneAndUpdate', function(next) {
  // Auto-expire if past expiration date
  if (this._update.expiresAt && new Date() > this._update.expiresAt) {
    this._update.status = 'expired';
  }
  next();
});

// Middleware to clean up expired sessions periodically
qrSchema.statics.cleanupExpired = async function() {
  const expiredSessions = await this.find({
    status: 'active',
    expiresAt: { $lt: new Date() }
  });

  for (const session of expiredSessions) {
    session.status = 'expired';
    await session.save();
  }

  return expiredSessions.length;
};

const QR = mongoose.model('QR', qrSchema);

module.exports = QR;
