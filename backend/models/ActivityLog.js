const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'ring',
      'flashlight_on',
      'flashlight_off',
      'set_alarm',
      'location_request',
      'device_connected',
      'device_disconnected',
      'status_update',
    ],
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries by user and date
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
