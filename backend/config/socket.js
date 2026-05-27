const { Server } = require('socket.io');
const { verifyToken } = require('../utils/tokenUtils');
const Device = require('../models/Device');
const { sendCommandToDevice: sendFCMCommand } = require('../services/fcmService');

let io;

// Active connections map: { userId: { web: [socketIds], devices: { deviceId: socketId } } }
const activeConnections = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = decoded.id;
      socket.clientType = socket.handshake.auth.clientType; // 'web' or 'device'
      socket.deviceId = socket.handshake.auth.deviceId; // For device clients

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id} (${socket.clientType})`);

    // Store connection
    if (!activeConnections.has(socket.userId)) {
      activeConnections.set(socket.userId, { web: [], devices: {} });
    }
    const userConnections = activeConnections.get(socket.userId);

    if (socket.clientType === 'web') {
      userConnections.web.push(socket.id);
    } else if (socket.clientType === 'device' && socket.deviceId) {
      userConnections.devices[socket.deviceId] = socket.id;
    }

    // Handle device connection
    if (socket.clientType === 'device') {
      handleDeviceConnection(socket);
    }

    // Handle web client connection
    if (socket.clientType === 'web') {
      handleWebConnection(socket);
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id} (${socket.clientType})`);

      if (socket.clientType === 'device') {
        handleDeviceDisconnection(socket);
      }

      // Remove from active connections
      const userConnections = activeConnections.get(socket.userId);
      if (userConnections) {
        if (socket.clientType === 'web') {
          userConnections.web = userConnections.web.filter(id => id !== socket.id);
        } else if (socket.clientType === 'device' && socket.deviceId) {
          delete userConnections.devices[socket.deviceId];
        }

        if (userConnections.web.length === 0 && Object.keys(userConnections.devices).length === 0) {
          activeConnections.delete(socket.userId);
        }
      }
    });

    // Listen for commands (can come from HTTP API or web socket)
    socket.on('command:execute', (data) => {
      handleCommandExecution(data);
    });
  });

  return io;
};

// Handle device-specific events
const handleDeviceConnection = async (socket) => {
  try {
    // Update device status to online
    if (socket.deviceId) {
      await Device.findOneAndUpdate(
        { deviceId: socket.deviceId, userId: socket.userId },
        { status: 'online', lastSeen: new Date() }
      );
    }

    // Listen for device status updates
    socket.on('device:status', async (data) => {
      try {
        const { batteryLevel, location, fcmToken } = data;

        if (socket.deviceId) {
          const updateData = {
            lastSeen: new Date(),
          };

          if (batteryLevel !== undefined) {
            updateData.batteryLevel = batteryLevel;
          }

          if (fcmToken) {
            updateData.fcmToken = fcmToken;
          }

          if (location) {
            updateData.location = {
              latitude: location.latitude,
              longitude: location.longitude,
              timestamp: new Date(),
            };
          }

          await Device.findOneAndUpdate(
            { deviceId: socket.deviceId, userId: socket.userId },
            updateData
          );

          // Forward status to all web clients if connected
          const userConnections = activeConnections.get(socket.userId);
          if (userConnections?.web?.length > 0) {
            userConnections.web.forEach(webSocketId => {
              io.to(webSocketId).emit('device:status', {
                deviceId: socket.deviceId,
                ...data,
              });
            });
          }
        }
      } catch (error) {
        console.error('Error updating device status:', error);
      }
    });

    // Listen for command responses
    socket.on('command:response', (data) => {
      // Forward response to all web clients
      const userConnections = activeConnections.get(socket.userId);
      if (userConnections?.web?.length > 0) {
        userConnections.web.forEach(webSocketId => {
          io.to(webSocketId).emit('command:response', data);
        });
      }
    });
  } catch (error) {
    console.error('Error in device connection handler:', error);
  }
};

// Handle device disconnection
const handleDeviceDisconnection = async (socket) => {
  try {
    if (socket.deviceId) {
      await Device.findOneAndUpdate(
        { deviceId: socket.deviceId, userId: socket.userId },
        { status: 'offline', lastSeen: new Date() }
      );

      // Notify all web clients
      const userConnections = activeConnections.get(socket.userId);
      if (userConnections?.web?.length > 0) {
        userConnections.web.forEach(webSocketId => {
          io.to(webSocketId).emit('device:offline', {
            deviceId: socket.deviceId,
          });
        });
      }
    }
  } catch (error) {
    console.error('Error in device disconnection handler:', error);
  }
};

// Handle command execution - route command to specific device
const handleCommandExecution = (data) => {
  try {
    const { userId, deviceId, command, payload, timestamp } = data;

    if (!userId || !deviceId || !command) {
      console.error('Invalid command data:', data);
      return;
    }

    const userConnections = activeConnections.get(userId);
    if (!userConnections) {
      console.error('User not connected:', userId);
      return;
    }

    const deviceSocketId = userConnections.devices[deviceId];
    if (!deviceSocketId) {
      console.error('Device not connected:', deviceId);
      return;
    }

    // Send command to specific device
    io.to(deviceSocketId).emit('command:execute', {
      command,
      payload,
      timestamp: timestamp || new Date(),
    });

    console.log(`📤 Command sent to device ${deviceId}: ${command}`);
  } catch (error) {
    console.error('Error executing command:', error);
  }
};

// Handle web client-specific events
const handleWebConnection = (socket) => {
  // Listen for commands from web client
  socket.on('command:send', async (data) => {
    try {
      const { deviceId, command, payload } = data;

      // Find the device socket
      const userConnections = activeConnections.get(socket.userId);
      const deviceSocketId = userConnections?.devices?.[deviceId];

      if (deviceSocketId) {
        // Device is online - use Socket.io (instant)
        io.to(deviceSocketId).emit('command:execute', {
          command,
          payload,
          timestamp: new Date(),
        });

        console.log(`📤 Command sent via Socket.io to ${deviceId}: ${command}`);

        // Send acknowledgment to web client
        socket.emit('command:sent', {
          deviceId,
          command,
          status: 'sent',
          method: 'socket',
        });
      } else {
        // Device is offline - try FCM
        try {
          const device = await Device.findOne({ deviceId, userId: socket.userId });

          if (!device) {
            throw new Error('Device not found');
          }

          if (!device.fcmToken) {
            throw new Error('Device has no FCM token');
          }

          // Send via FCM
          await sendFCMCommand(device.fcmToken, command, payload);

          console.log(`📲 Command sent via FCM to ${deviceId}: ${command}`);

          socket.emit('command:sent', {
            deviceId,
            command,
            status: 'sent',
            method: 'fcm',
          });
        } catch (fcmError) {
          console.error('FCM send error:', fcmError);
          socket.emit('command:error', {
            deviceId,
            command,
            error: 'Device offline and FCM unavailable',
          });
        }
      }
    } catch (error) {
      console.error('Error sending command:', error);
      socket.emit('command:error', {
        error: 'Failed to send command',
      });
    }
  });

  // Request device status
  socket.on('device:requestStatus', (data) => {
    const { deviceId } = data || {};
    const userConnections = activeConnections.get(socket.userId);
    const deviceSocketId = userConnections?.devices?.[deviceId];

    if (deviceSocketId) {
      io.to(deviceSocketId).emit('device:getStatus');
    }
  });
};

// Get Socket.io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Get active connections (for debugging)
const getActiveConnections = () => {
  return activeConnections;
};

// Send command to device (called from HTTP API)
const sendCommandToDevice = (userId, deviceId, command, payload) => {
  handleCommandExecution({
    userId,
    deviceId,
    command,
    payload,
    timestamp: new Date(),
  });
};

module.exports = {
  initializeSocket,
  getIO,
  getActiveConnections,
  sendCommandToDevice,
};
