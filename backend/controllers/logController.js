const ActivityLog = require('../models/ActivityLog');

// @desc    Get activity logs
// @route   GET /api/logs
// @route   GET /api/logs/:deviceId
// @access  Private
exports.getLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 50, page = 1 } = req.query;
    
    // Get deviceId from params or query
    const deviceId = req.params.deviceId || req.query.deviceId;

    // Build query
    const query = { userId: req.user.id };

    if (deviceId) {
      query.deviceId = deviceId;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Get logs
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('deviceId', 'deviceName deviceId');

    // Get total count
    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      logs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create activity log (internal use)
exports.createLog = async (userId, deviceId, action, metadata = {}) => {
  try {
    await ActivityLog.create({
      userId,
      deviceId,
      action,
      metadata,
    });
  } catch (error) {
    console.error('Error creating activity log:', error);
  }
};
