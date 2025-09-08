const express = require('express');
const { body, validationResult } = require('express-validator');
const QRCode = require('qrcode');
const QR = require('../models/QR');
const Course = require('../models/Course');
const { authenticateToken, requireLecturer, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/qr
// @desc    Get QR code sessions
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, courseId, status, active } = req.query;
    
    // Build query
    const query = {};
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;
    if (active === 'true') {
      query.expiresAt = { $gt: new Date() };
      query.status = 'active';
    }

    const qrSessions = await QR.find(query)
      .populate('courseId', 'name code')
      .populate('createdBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await QR.countDocuments(query);

    res.json({
      success: true,
      data: {
        qrSessions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalSessions: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get QR sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching QR sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/qr/generate
// @desc    Generate a new QR code for attendance (alternative to POST method)
// @access  Private (Lecturer/Admin)
router.get('/generate', requireLecturer, async (req, res) => {
  try {
    const { courseId, duration, title, notes } = req.query;
    
    // Validate required parameters
    if (!courseId || !duration) {
      return res.status(400).json({
        success: false,
        message: 'courseId and duration are required query parameters'
      });
    }

    // Basic validation
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 1 || durationNum > 480) {
      return res.status(400).json({
        success: false,
        message: 'Duration must be between 1 and 480 minutes'
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if lecturer has access to this course
    if (req.user.role === 'lecturer' && course.lecturer?.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only generate QR codes for your own courses'
      });
    }

    // Generate unique QR code data
    const qrData = {
      sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
      courseId,
      createdBy: req.user.userId,
      expiresAt: new Date(Date.now() + durationNum * 60 * 1000), // Convert minutes to milliseconds
      title: title || `Attendance Session - ${course.name}`,
      notes: notes || ''
    };

    // Create QR code session
    const qrSession = new QR(qrData);
    await qrSession.save();

    // Generate QR code image
    const qrCodeData = JSON.stringify({
      sessionId: qrSession._id,
      courseId,
      expiresAt: qrSession.expiresAt
    });

    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1
    });

    res.status(201).json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrSession,
        qrCodeImage,
        expiresAt: qrSession.expiresAt,
        duration: durationNum
      }
    });

  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating QR code',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});



// @route   GET /api/qr/validate
// @desc    Validate a scanned QR code
// @access  Private
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    const { qrCode } = req.query;
    
    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required as query parameter'
      });
    }

    let qrData;
    try {
      qrData = JSON.parse(qrCode);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    const { sessionId, courseId, expiresAt } = qrData;

    // Find QR session
    const qrSession = await QR.findById(sessionId)
      .populate('courseId', 'name code')
      .populate('createdBy', 'name');

    if (!qrSession) {
      return res.status(404).json({
        success: false,
        message: 'QR session not found'
      });
    }

    // Check if session is expired
    if (new Date() > new Date(expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'QR code has expired',
        data: {
          sessionId,
          courseId,
          expiresAt
        }
      });
    }

    // Check if session is active
    if (qrSession.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'QR session is not active',
        data: {
          sessionId,
          courseId,
          status: qrSession.status
        }
      });
    }

    // Check if student is enrolled in the course
    if (req.user.role === 'student') {
      const course = await Course.findById(courseId);
      if (!course || !course.students.some(s => s.student.toString() === req.user.userId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not enrolled in this course'
        });
      }
    }

    res.json({
      success: true,
      message: 'QR code is valid',
      data: {
        sessionId,
        courseId,
        courseName: qrSession.courseId.name,
        courseCode: qrSession.courseId.code,
        expiresAt: qrSession.expiresAt,
        title: qrSession.title,
        notes: qrSession.notes,
        createdBy: qrSession.createdBy.name
      }
    });

  } catch (error) {
    console.error('Validate QR code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating QR code',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/qr/sessions
// @desc    Get active QR sessions for a course
// @access  Private
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.query;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const activeSessions = await QR.find({
      courseId,
      status: 'active',
      expiresAt: { $gt: new Date() }
    })
    .populate('courseId', 'name code')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        activeSessions,
        count: activeSessions.length
      }
    });

  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/qr/active
// @desc    Get currently active QR sessions
// @access  Private
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const activeSessions = await QR.find({
      status: 'active',
      expiresAt: { $gt: new Date() }
    })
    .populate('courseId', 'name code')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        activeSessions,
        count: activeSessions.length
      }
    });

  } catch (error) {
    console.error('Get active sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching active sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   PUT /api/qr/:id/expire
// @desc    Manually expire a QR session
// @access  Private (Lecturer/Admin)
router.put('/:id/expire', requireLecturer, async (req, res) => {
  try {
    const { id } = req.params;

    const qrSession = await QR.findById(id);
    if (!qrSession) {
      return res.status(404).json({
        success: false,
        message: 'QR session not found'
      });
    }

    // Check if lecturer has access to this session
    if (req.user.role === 'lecturer' && qrSession.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only expire your own QR sessions'
      });
    }

    // Expire the session
    qrSession.status = 'expired';
    qrSession.expiresAt = new Date();
    await qrSession.save();

    res.json({
      success: true,
      message: 'QR session expired successfully',
      data: { qrSession }
    });

  } catch (error) {
    console.error('Expire QR session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while expiring QR session',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
