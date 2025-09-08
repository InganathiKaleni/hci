const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const { requireAdmin, requireLecturer } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, department, search } = req.query;
    
    // Build query
    const query = {};
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalCourses: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/courses
// @desc    Create a new course (alternative to POST method)
// @access  Private (Admin/Lecturer)
router.get('/create', requireAdmin, async (req, res) => {
  try {
    const { name, code, description, department, credits, lecturer } = req.query;
    
    // Validate required parameters
    if (!name || !code || !department || !credits) {
      return res.status(400).json({
        success: false,
        message: 'name, code, department, and credits are required query parameters'
      });
    }

    // Basic validation
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Course name must be between 2 and 100 characters'
      });
    }

    if (code.length < 2 || code.length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Course code must be between 2 and 20 characters'
      });
    }

    if (!department.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Department is required'
      });
    }

    const creditsNum = parseInt(credits);
    if (isNaN(creditsNum) || creditsNum < 1 || creditsNum > 10) {
      return res.status(400).json({
        success: false,
        message: 'Credits must be between 1 and 10'
      });
    }

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }

    // Create new course
    const course = new Course({
      name,
      code,
      description: description || '',
      department,
      credits: creditsNum,
      lecturer: lecturer || null
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});



// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Admin/Lecturer)
router.put('/:id', [
  requireAdmin,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Course name must be between 2 and 100 characters'),
  
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Course code must be between 2 and 20 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  
  body('credits')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10')
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

    const { name, code, description, credits } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (code) updateData.code = code;
    if (description) updateData.description = description;
    if (credits) updateData.credits = credits;

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting course',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll student in course
// @access  Private
router.post('/:id/enroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if student is already enrolled
    if (course.students.some(s => s.student.toString() === studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    course.students.push({ student: studentId });
    await course.save();

    res.json({
      success: true,
      message: 'Student enrolled successfully',
      data: { course }
    });

  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while enrolling student',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/courses/:id/unenroll
// @desc    Unenroll student from course
// @access  Private
router.post('/:id/unenroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if student is enrolled
    if (!course.students.some(s => s.student.toString() === studentId)) {
      return res.status(400).json({
        success: false,
        message: 'Student is not enrolled in this course'
      });
    }

    course.students = course.students.filter(s => s.student.toString() !== studentId);
    await course.save();

    res.json({
      success: true,
      message: 'Student unenrolled successfully',
      data: { course }
    });

  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while unenrolling student',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
