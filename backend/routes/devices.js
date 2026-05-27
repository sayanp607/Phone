const express = require('express');
const {
  registerDevice,
  getDevices,
  getDevice,
  updateDeviceStatus,
  deleteDevice,
  sendCommand,
} = require('../controllers/deviceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Device registration and listing
router.route('/register').post(registerDevice);
router.route('/').get(getDevices);

// Single device operations
router.route('/:id').get(getDevice).delete(deleteDevice);

// Device status update
router.route('/:id/status').put(updateDeviceStatus);

// Send command to device
router.route('/:id/command').post(sendCommand);

module.exports = router;
