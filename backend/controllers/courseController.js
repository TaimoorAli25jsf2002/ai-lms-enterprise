// backend/controllers/courseController.js
const Course = require('../models/Course');
const User = require('../models/User');
const { Progress } = require('../models/Progress');
const { Notification } = require('../models/Notification');

// @route   GET /api/courses
// @desc    Get all published courses with filters
// @access  Public
exports.getAllCourses = async (req, res) => {
  try {
    const { 
      category, 
      difficulty, 
      ageGroup, 
      search,
      sort = '-createdAt',
      page = 1,
      limit = 12
    } = req.query;

    // Build query
    let query = { isPublished: true };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (ageGroup) query.ageGroup = ageGroup;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Execute query with pagination
    const courses = await Course.find(query)
      .populate('instructor', 'name avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const count = await Course.countDocuments(query);

    res.json({
      success: true,
      count: courses.length,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      courses
    });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   GET /api/courses/:id
// @desc    Get single course by ID
// @access  Public
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar email')
      .populate({
        path: 'reviews.user',
        select: 'name avatar'
      });

    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Check if user is enrolled (if authenticated)
    let isEnrolled = false;
    let userProgress = null;

    if (req.user) {
      isEnrolled = course.enrolledStudents.some(
        student => student.toString() === req.user.id
      );
      
      if (isEnrolled) {
        userProgress = await Progress.findOne({
          user: req.user.id,
          course: course._id
        });
      }
    }

    res.json({ 
      success: true, 
      course,
      isEnrolled,
      progress: userProgress 
    });

  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   POST /api/courses
// @desc    Create new course (Teacher/Admin only)
// @access  Private
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      ageGroup,
      thumbnail,
      tags,
      skills,
      prerequisites,
      isFree,
      price,
      requiredPlan
    } = req.body;

    const course = await Course.create({
      title,
      description,
      category,
      difficulty,
      ageGroup,
      thumbnail,
      tags,
      skills,
      prerequisites,
      isFree,
      price,
      requiredPlan,
      instructor: req.user.id,
      modules: []
    });

    res.status(201).json({
      success: true,
      course,
      message: 'Course created successfully! 🎉'
    });

  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Owner/Admin only)
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Check ownership
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this course' 
      });
    }

    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      course,
      message: 'Course updated successfully!' 
    });

  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   DELETE /api/courses/:id
// @desc    Delete course
// @access  Private (Admin only)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    await course.deleteOne();

    res.json({ 
      success: true, 
      message: 'Course deleted successfully' 
    });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   POST /api/courses/enroll/:id
// @desc    Enroll in course
// @access  Private
exports.enrollInCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Check if already enrolled
    if (course.enrolledStudents.includes(req.user.id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Already enrolled in this course' 
      });
    }

    // Check subscription requirement
    const user = await User.findById(req.user.id);
    const planHierarchy = { free: 0, basic: 1, premium: 2, enterprise: 3 };
    
    if (planHierarchy[user.subscription] < planHierarchy[course.requiredPlan]) {
      return res.status(403).json({ 
        success: false,
        message: `This course requires ${course.requiredPlan} plan or higher`,
        requiredPlan: course.requiredPlan 
      });
    }

    // Enroll student
    course.enrolledStudents.push(req.user.id);
    await course.save();

    // Add course to user's enrolled courses
    user.enrolledCourses.push(course._id);
    await user.save();

    // Create progress tracker
    await Progress.create({
      user: req.user.id,
      course: course._id,
      status: 'not-started',
      overallProgress: 0
    });

    // Create notification
    await Notification.create({
      user: req.user.id,
      title: 'Course Enrollment',
      message: `You've successfully enrolled in ${course.title}! 🎉`,
      type: 'course',
      link: `/courses/${course._id}`
    });

    res.json({ 
      success: true, 
      message: 'Successfully enrolled in course! 🎉',
      course 
    });

  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   GET /api/courses/my/enrolled
// @desc    Get enrolled courses for current user
// @access  Private
exports.getEnrolledCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'enrolledCourses',
        populate: { path: 'instructor', select: 'name avatar' }
      });

    // Get progress for each course
    const coursesWithProgress = await Promise.all(
      user.enrolledCourses.map(async (course) => {
        const progress = await Progress.findOne({
          user: req.user.id,
          course: course._id
        });

        return {
          ...course.toObject(),
          progress: progress?.overallProgress || 0,
          status: progress?.status || 'not-started',
          lastAccessed: progress?.lastAccessed || null,
          nextLesson: await progress?.getNextLesson() || null
        };
      })
    );

    res.json({ 
      success: true, 
      count: coursesWithProgress.length,
      courses: coursesWithProgress 
    });

  } catch (error) {
    console.error('Get enrolled courses error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   POST /api/courses/:courseId/modules
// @desc    Add module to course
// @access  Private (Instructor/Admin)
exports.addModule = async (req, res) => {
  try {
    const { title, description, icon, order } = req.body;
    
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized' 
      });
    }

    course.modules.push({
      title,
      description,
      icon,
      order: order || course.modules.length + 1,
      lessons: []
    });

    await course.save();

    res.json({ 
      success: true, 
      course,
      message: 'Module added successfully!' 
    });

  } catch (error) {
    console.error('Add module error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   POST /api/courses/:courseId/modules/:moduleId/lessons
// @desc    Add lesson to module
// @access  Private (Instructor/Admin)
exports.addLesson = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      content, 
      videoUrl, 
      duration,
      aiPlayground,
      exercise,
      resources 
    } = req.body;
    
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    const module = course.modules.id(req.params.moduleId);
    
    if (!module) {
      return res.status(404).json({ 
        success: false,
        message: 'Module not found' 
      });
    }

    module.lessons.push({
      title,
      description,
      type,
      content,
      videoUrl,
      duration,
      aiPlayground,
      exercise,
      resources,
      order: module.lessons.length + 1
    });

    await course.save();

    res.json({ 
      success: true, 
      course,
      message: 'Lesson added successfully!' 
    });

  } catch (error) {
    console.error('Add lesson error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

// @route   POST /api/courses/:id/review
// @desc    Add review to course
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    // Check if user is enrolled
    if (!course.enrolledStudents.includes(req.user.id)) {
      return res.status(403).json({ 
        success: false,
        message: 'You must be enrolled to review this course' 
      });
    }

    // Check if already reviewed
    const existingReview = course.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (existingReview) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already reviewed this course' 
      });
    }

    // Add review
    course.reviews.push({
      user: req.user.id,
      rating,
      comment
    });

    // Update course rating
    course.updateRating();
    await course.save();

    res.json({ 
      success: true, 
      course,
      message: 'Review added successfully!' 
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = exports;