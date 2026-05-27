const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register route with validation
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  register
);

// Login route
router.post('/login', login);

// Get current user (protected route)
router.get('/me', protect, getMe);

module.exports = router;
