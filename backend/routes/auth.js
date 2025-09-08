const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   GET /api/auth/register
// @desc    Register a new user (alternative to POST method for simple registration)
// @access  Public
router.get('/register', async (req, res) => {
  try {
    const { name, email, password, role, studentId, lecturerId, department, course, year } = req.query;
    
    // Validate required parameters
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password, and role are required query parameters'
      });
    }

    // Basic validation
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    if (!['admin', 'lecturer', 'student'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected'
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user object
    const userData = {
      name,
      email,
      password,
      role,
      department
    };

    // Add role-specific fields
    if (role === 'student') {
      if (studentId) userData.studentId = studentId;
      if (course) userData.course = course;
      if (year) userData.year = parseInt(year);
    } else if (role === 'lecturer') {
      if (lecturerId) userData.lecturerId = lecturerId;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});



// @route   GET /api/auth/login
// @desc    Authenticate user & get token (alternative to POST method)
// @access  Public
router.get('/login', async (req, res) => {
  try {
    const { email, password, role } = req.query;
    
    // Validate required parameters
    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'email, password, and role are required query parameters'
      });
    }

    // Basic validation
    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (!['admin', 'lecturer', 'student'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected'
      });
    }

    // Find user by email and include password for comparison
    const user = await User.findOne({ email, role }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});



// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while refreshing token',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client should remove token)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated system, you might want to blacklist the token
    // For now, we'll just return success and let the client handle token removal
    
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/auth/change-password
// @desc    Change user password (alternative to POST method)
// @access  Private
router.get('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.query;
    
    // Validate required parameters
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'currentPassword and newPassword are required query parameters'
      });
    }

    // Basic validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Find user with password
    const user = await User.findById(req.user.userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});



// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password-reset' },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );

    // In a real application, you would:
    // 1. Save the reset token to the user document
    // 2. Send an email with the reset link
    // 3. Handle token expiration

    // For now, we'll just return success
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing password reset',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
