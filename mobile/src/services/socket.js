import io from 'socket.io-client';
import { storage } from '../utils/storage';
import { commandService } from './commandService';
import * as Battery from 'expo-battery';

const SOCKET_URL = process.env.SOCKET_URL || 'http://192.168.29.145:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.deviceId = null;
    this.fcmToken = null;
    this.isConnected = false;
  }

  async connect(deviceId, fcmToken = null) {
    try {
      const token = await storage.getToken();

      if (!token) {
        throw new Error('No authentication token found');
      }

      this.deviceId = deviceId;
      this.fcmToken = fcmToken;

      // Create socket connection with authentication
      this.socket = io(SOCKET_URL, {
        auth: {
          token,
          clientType: 'device',
          deviceId,
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        this.socket.on('connect', () => {
          console.log('✅ Socket connected:', this.socket.id);
          this.isConnected = true;
          this.sendStatusUpdate();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error.message);
          this.isConnected = false;
          reject(error);
        });
      });
    } catch (error) {
      console.error('Socket connection error:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Handle disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
    });

    // Handle reconnection
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.sendStatusUpdate();
    });

    // Listen for commands from web client
    this.socket.on('command:execute', async (data) => {
      console.log('📥 Received command:', data);
      const { command, payload } = data;

      // Execute command
      await commandService.executeCommand(command, payload, this.socket);
    });

    // Listen for status request
    this.socket.on('device:getStatus', () => {
      console.log('📥 Status request received');
      this.sendStatusUpdate();
    });
  }

  async sendStatusUpdate() {
    try {
      // Get battery level
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const batteryPercentage = Math.round(batteryLevel * 100);

      // Send status to server
      this.socket.emit('device:status', {
        batteryLevel: batteryPercentage,
        fcmToken: this.fcmToken,
        timestamp: new Date().toISOString(),
      });

      console.log('📤 Status update sent:', batteryPercentage + '%');
    } catch (error) {
      console.error('Error sending status update:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected manually');
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export default new SocketService();
