const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Add user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to check if user has specific role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole(['admin']);

/**
 * Middleware to check if user is lecturer
 */
const requireLecturer = requireRole(['admin', 'lecturer']);

/**
 * Middleware to check if user is student
 */
const requireStudent = requireRole(['admin', 'lecturer', 'student']);

/**
 * Middleware to check if user can access specific resource
 */
const canAccessResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Check resource-specific permissions
      switch (resourceType) {
        case 'course':
          // Lecturers can access their own courses
          // Students can access courses they're enrolled in
          if (req.user.role === 'lecturer') {
            // Check if lecturer owns the course
            const courseId = req.params.courseId || req.body.courseId;
            if (courseId) {
              const Course = require('../models/Course');
              const course = await Course.findById(courseId);
              if (!course || course.lecturer.toString() !== req.user.userId.toString()) {
                return res.status(403).json({
                  success: false,
                  message: 'Access denied - course not found or not owned by you'
                });
              }
            }
          }
          break;

        case 'attendance':
          // Lecturers can access attendance for their courses
          // Students can access their own attendance
          if (req.user.role === 'lecturer') {
            const courseId = req.params.courseId || req.body.courseId;
            if (courseId) {
              const Course = require('../models/Course');
              const course = await Course.findById(courseId);
              if (!course || course.lecturer.toString() !== req.user.userId.toString()) {
                return res.status(403).json({
                  success: false,
                  message: 'Access denied - course not found or not owned by you'
                });
              }
            }
          }
          break;

        case 'user':
          // Users can only access their own profile
          const userId = req.params.userId || req.body.userId;
          if (userId && userId !== req.user.userId.toString()) {
            return res.status(403).json({
              success: false,
              message: 'Access denied - can only access own profile'
            });
          }
          break;

        default:
          break;
      }

      next();
    } catch (error) {
      console.error('Resource access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource access'
      });
    }
  };
};

/**
 * Middleware to rate limit specific actions
 */
const rateLimitAction = (action, maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.user?.userId || req.ip}-${action}`;
    const now = Date.now();
    const userAttempts = attempts.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset if window has passed
    if (now > userAttempts.resetTime) {
      userAttempts.count = 0;
      userAttempts.resetTime = now + windowMs;
    }

    // Check if limit exceeded
    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Too many ${action} attempts. Please try again later.`
      });
    }

    // Increment attempt count
    userAttempts.count++;
    attempts.set(key, userAttempts);

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireLecturer,
  requireStudent,
  canAccessResource,
  rateLimitAction
};
