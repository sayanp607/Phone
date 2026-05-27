const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  deviceName: {
    type: String,
    required: [true, 'Please provide a device name'],
    trim: true,
  },
  deviceId: {
    type: String,
    required: [true, 'Please provide a device ID'],
    unique: true,
  },
  fcmToken: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline',
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  batteryLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  location: {
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      default: null,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
deviceSchema.index({ userId: 1, deviceId: 1 });

module.exports = mongoose.model('Device', deviceSchema);
