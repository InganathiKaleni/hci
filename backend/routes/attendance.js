const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const User = require('../models/User');
const { authenticateToken, requireAdmin, requireLecturer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/attendance
// @desc    Get attendance records
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, courseId, studentId, date, status } = req.query;
    
    // Build query
    const query = {};
    if (courseId) query.courseId = courseId;
    if (studentId) query.studentId = studentId;
    if (date) query.date = new Date(date);
    if (status) query.status = status;

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name studentId')
      .populate('courseId', 'name code')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1, createdAt: -1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});



// @route   GET /api/attendance/mark
// @desc    Mark attendance for a student (alternative to POST method)
// @access  Private
router.get('/mark', authenticateToken, async (req, res) => {
  try {
    const { studentId, courseId, date, status, notes } = req.query;
    
    // Validate required parameters
    if (!studentId || !courseId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: 'studentId, courseId, date, and status are required query parameters'
      });
    }

    // Validate status
    if (!['present', 'absent', 'late', 'excused'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be present, absent, late, or excused'
      });
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
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

    // Check if attendance already exists for this student, course, and date
    const existingAttendance = await Attendance.findOne({
      studentId,
      courseId,
      date: new Date(date)
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      if (notes) existingAttendance.notes = notes;
      existingAttendance.updatedAt = new Date();
      
      await existingAttendance.save();

      return res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: { attendance: existingAttendance }
      });
    }

    // Create new attendance record
    const attendance = new Attendance({
      studentId,
      courseId,
      date: new Date(date),
      status,
      notes,
      markedBy: req.user.userId
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: { attendance }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/attendance/report
// @desc    Get attendance report
// @access  Private
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const { courseId, studentId, startDate, endDate, groupBy = 'course' } = req.query;
    
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

    let report;
    
    if (groupBy === 'course') {
      // Group by course
      report = await Attendance.aggregate([
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
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        {
          $group: {
            _id: '$courseId',
            courseName: { $first: '$course.name' },
            courseCode: { $first: '$course.code' },
            totalSessions: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
            },
            late: {
              $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
            },
            excused: {
              $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] }
            }
          }
        },
        {
          $addFields: {
            attendanceRate: {
              $multiply: [
                { $divide: ['$present', '$totalSessions'] },
                100
              ]
            }
          }
        }
      ]);
    } else if (groupBy === 'student') {
      // Group by student
      report = await Attendance.aggregate([
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
          $lookup: {
            from: 'courses',
            localField: 'courseId',
            foreignField: '_id',
            as: 'course'
          }
        },
        {
          $group: {
            _id: '$studentId',
            studentName: { $first: '$student.name' },
            studentId: { $first: '$student.studentId' },
            totalSessions: { $sum: 1 },
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
            },
            late: {
              $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
            },
            excused: {
              $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] }
            }
          }
        },
        {
          $addFields: {
            attendanceRate: {
              $multiply: [
                { $divide: ['$present', '$totalSessions'] },
                100
              ]
            }
          }
        }
      ]);
    }

    res.json({
      success: true,
      data: {
        report,
        filters: {
          courseId,
          studentId,
          startDate,
          endDate,
          groupBy
        }
      }
    });

  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating attendance report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/attendance/course/:courseId
// @desc    Get attendance for a specific course
// @access  Private
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date, page = 1, limit = 10 } = req.query;
    
    const query = { courseId };
    if (date) query.date = new Date(date);

    const attendance = await Attendance.find(query)
      .populate('studentId', 'name studentId')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1, createdAt: -1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get course attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching course attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/attendance/student/:studentId
// @desc    Get attendance for a specific student
// @access  Private
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate, page = 1, limit = 10 } = req.query;
    
    const query = { studentId };
    if (courseId) query.courseId = courseId;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('courseId', 'name code')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1, createdAt: -1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: {
        attendance,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get student attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching student attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
