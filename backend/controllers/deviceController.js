const Device = require('../models/Device');
const ActivityLog = require('../models/ActivityLog');

// @desc    Register new device
// @route   POST /api/devices/register
// @access  Private
exports.registerDevice = async (req, res, next) => {
  try {
    const { deviceName, deviceId, fcmToken } = req.body;

    if (!deviceName || !deviceId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide device name and device ID',
      });
    }

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      // If device exists but belongs to different user
      if (existingDevice.userId.toString() !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Device is already registered to another user',
        });
      }
      // Update FCM token if provided
      if (fcmToken) {
        existingDevice.fcmToken = fcmToken;
        await existingDevice.save();
      }
      // If device already belongs to this user
      return res.status(200).json({
        success: true,
        message: 'Device already registered',
        device: existingDevice,
      });
    }

    // Create new device
    const device = await Device.create({
      userId: req.user.id,
      deviceName,
      deviceId,
      fcmToken: fcmToken || null,
      status: 'offline',
    });

    res.status(201).json({
      success: true,
      message: 'Device registered successfully',
      device,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all user devices
// @route   GET /api/devices
// @access  Private
exports.getDevices = async (req, res, next) => {
  try {
    const devices = await Device.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: devices.length,
      devices,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single device
// @route   GET /api/devices/:id
// @access  Private
exports.getDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Check ownership
    if (device.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this device',
      });
    }

    res.status(200).json({
      success: true,
      device,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update device status
// @route   PUT /api/devices/:id/status
// @access  Private
exports.updateDeviceStatus = async (req, res, next) => {
  try {
    const { status, batteryLevel, location, fcmToken } = req.body;

    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Check ownership
    if (device.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this device',
      });
    }

    // Update fields
    if (status) device.status = status;
    if (batteryLevel !== undefined) device.batteryLevel = batteryLevel;
    if (fcmToken) device.fcmToken = fcmToken;
    if (location) {
      device.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: new Date(),
      };
    }
    device.lastSeen = new Date();

    await device.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      deviceId: device._id,
      action: 'status_update',
      metadata: { status, batteryLevel, location },
    });

    res.status(200).json({
      success: true,
      message: 'Device status updated',
      device,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private
exports.deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Check ownership
    if (device.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this device',
      });
    }

    await device.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Device removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send command to device
// @route   POST /api/devices/:id/command
// @access  Private
exports.sendCommand = async (req, res, next) => {
  try {
    const { command, payload } = req.body;

    if (!command) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a command',
      });
    }

    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found',
      });
    }

    // Check ownership
    if (device.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to control this device',
      });
    }

    let commandSent = false;

    // Try to send via FCM first (works even when app is closed)
    if (device.fcmToken) {
      const { sendCommandNotification } = require('../config/firebase');
      const fcmResult = await sendCommandNotification(device.fcmToken, command, payload || {});
      
      if (fcmResult.success) {
        commandSent = true;
        console.log('Command sent via FCM');
      } else {
        console.warn('FCM failed, trying Socket.io:', fcmResult.error);
      }
    }

    // Fallback to Socket.io if FCM failed or not available (for online devices)
    if (!commandSent && device.status === 'online') {
      const { sendCommandToDevice } = require('../config/socket');
      sendCommandToDevice(req.user.id, device.deviceId, command, payload);
      commandSent = true;
      console.log('Command sent via Socket.io');
    }

    if (!commandSent) {
      return res.status(400).json({
        success: false,
        message: 'Unable to send command. Device may be offline or notifications not configured.',
      });
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      deviceId: device._id,
      action: command,
      details: `Command sent: ${command}`,
      metadata: payload,
    });

    res.status(200).json({
      success: true,
      message: 'Command sent successfully',
      command,
    });
  } catch (error) {
    next(error);
  }
};
