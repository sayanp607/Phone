const express = require('express');
const { getLogs } = require('../controllers/logController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get activity logs with filtering
router.route('/').get(getLogs);

// Get logs for specific device
router.route('/:deviceId').get(getLogs);

module.exports = router;
