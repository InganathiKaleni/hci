const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireLecturer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reports
// @desc    Get available report templates
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const reportTemplates = [
      {
        id: 'attendance_summary',
        name: 'Attendance Summary Report',
        description: 'Overall attendance statistics for courses and students',
        parameters: ['startDate', 'endDate', 'courseId', 'studentId', 'groupBy'],
        formats: ['json', 'csv', 'pdf']
      },
      {
        id: 'course_attendance',
        name: 'Course Attendance Report',
        description: 'Detailed attendance report for specific courses',
        parameters: ['courseId', 'startDate', 'endDate', 'includeStudents'],
        formats: ['json', 'csv', 'pdf']
      },
      {
        id: 'student_attendance',
        name: 'Student Attendance Report',
        description: 'Individual student attendance records and statistics',
        parameters: ['studentId', 'startDate', 'endDate', 'includeCourses'],
        formats: ['json', 'csv', 'pdf']
      },
      {
        id: 'qr_session_report',
        name: 'QR Session Report',
        description: 'Report on QR code sessions and their usage',
        parameters: ['courseId', 'startDate', 'endDate', 'status'],
        formats: ['json', 'csv']
      }
    ];

    res.json({
      success: true,
      data: {
        templates: reportTemplates
      }
    });

  } catch (error) {
    console.error('Get report templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report templates',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/reports/generate
// @desc    Generate a report based on template and parameters
// @access  Private
router.post('/generate', [
  authenticateToken,
  body('templateId')
    .isIn(['attendance_summary', 'course_attendance', 'student_attendance', 'qr_session_report'])
    .withMessage('Valid template ID is required'),
  
  body('parameters')
    .isObject()
    .withMessage('Parameters object is required'),
  
  body('format')
    .optional()
    .isIn(['json', 'csv', 'pdf'])
    .withMessage('Format must be json, csv, or pdf')
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

    const { templateId, parameters, format = 'json' } = req.body;

    let reportData;
    let reportMetadata;

    switch (templateId) {
      case 'attendance_summary':
        reportData = await generateAttendanceSummaryReport(parameters);
        reportMetadata = {
          template: 'Attendance Summary Report',
          generatedAt: new Date(),
          parameters,
          recordCount: reportData.length
        };
        break;

      case 'course_attendance':
        reportData = await generateCourseAttendanceReport(parameters);
        reportMetadata = {
          template: 'Course Attendance Report',
          generatedAt: new Date(),
          parameters,
          recordCount: reportData.length
        };
        break;

      case 'student_attendance':
        reportData = await generateStudentAttendanceReport(parameters);
        reportMetadata = {
          template: 'Student Attendance Report',
          generatedAt: new Date(),
          parameters,
          recordCount: reportData.length
        };
        break;

      case 'qr_session_report':
        reportData = await generateQRSessionReport(parameters);
        reportMetadata = {
          template: 'QR Session Report',
          generatedAt: new Date(),
          parameters,
          recordCount: reportData.length
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid template ID'
        });
    }

    // Store report metadata (in a real app, you'd save this to a database)
    const reportId = Date.now().toString(36) + Math.random().toString(36).substr(2);

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        reportId,
        metadata: reportMetadata,
        data: reportData,
        format,
        downloadUrl: `/api/reports/export?reportId=${reportId}&format=${format}`
      }
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/reports/export
// @desc    Export a generated report in specified format
// @access  Private
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const { reportId, format = 'json' } = req.query;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: 'Report ID is required'
      });
    }

    // In a real application, you would:
    // 1. Retrieve the stored report data using reportId
    // 2. Convert it to the requested format
    // 3. Set appropriate headers for download
    // 4. Send the formatted data

    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Report export endpoint working',
      data: {
        reportId,
        format,
        note: 'This is a placeholder. In production, this would return the actual formatted report file.'
      }
    });

  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while exporting report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper functions for report generation
async function generateAttendanceSummaryReport(parameters) {
  const { startDate, endDate, courseId, studentId, groupBy = 'course' } = parameters;
  
  // Build date range
  const dateQuery = {};
  if (startDate && endDate) {
    dateQuery.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Build main query
  const query = { ...dateQuery };
  if (courseId) query.courseId = courseId;
  if (studentId) query.studentId = studentId;

  if (groupBy === 'course') {
    return await Attendance.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course'
        }
      },
      {
        $group: {
          _id: '$courseId',
          courseName: { $first: '$course.name' },
          courseCode: { $first: '$course.code' },
          totalSessions: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          attendanceRate: {
            $multiply: [{ $divide: ['$present', '$totalSessions'] }, 100]
          }
        }
      }
    ]);
  } else {
    return await Attendance.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $group: {
          _id: '$studentId',
          studentName: { $first: '$student.name' },
          studentId: { $first: '$student.studentId' },
          totalSessions: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
        }
      },
      {
        $addFields: {
          attendanceRate: {
            $multiply: [{ $divide: ['$present', '$totalSessions'] }, 100]
          }
        }
      }
    ]);
  }
}

async function generateCourseAttendanceReport(parameters) {
  const { courseId, startDate, endDate, includeStudents = true } = parameters;
  
  if (!courseId) {
    throw new Error('Course ID is required for course attendance report');
  }

  const dateQuery = {};
  if (startDate && endDate) {
    dateQuery.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const query = { courseId, ...dateQuery };

  if (includeStudents) {
    return await Attendance.find(query)
      .populate('studentId', 'name studentId')
      .populate('courseId', 'name code')
      .sort({ date: -1 });
  } else {
    return await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$date',
          totalStudents: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
        }
      },
      { $sort: { _id: -1 } }
    ]);
  }
}

async function generateStudentAttendanceReport(parameters) {
  const { studentId, startDate, endDate, includeCourses = true } = parameters;
  
  if (!studentId) {
    throw new Error('Student ID is required for student attendance report');
  }

  const dateQuery = {};
  if (startDate && endDate) {
    dateQuery.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const query = { studentId, ...dateQuery };

  if (includeCourses) {
    return await Attendance.find(query)
      .populate('courseId', 'name code')
      .sort({ date: -1 });
  } else {
    return await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$courseId',
          courseName: { $first: '$courseId.name' },
          totalSessions: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
        }
      }
    ]);
  }
}

async function generateQRSessionReport(parameters) {
  const { courseId, startDate, endDate, status } = parameters;
  
  const dateQuery = {};
  if (startDate && endDate) {
    dateQuery.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const query = { ...dateQuery };
  if (courseId) query.courseId = courseId;
  if (status) query.status = status;

  // This would require a QR model - for now return placeholder
  return [{
    note: 'QR Session Report - This would show QR code generation and usage statistics',
    parameters,
    generatedAt: new Date()
  }];
}

module.exports = router;
