import { deviceAPI } from './api';
import { generateDeviceId, getDeviceName } from '../utils/deviceId';

export const deviceService = {
  async registerDevice(fcmToken = null) {
    try {
      // Generate or retrieve device ID
      const deviceId = await generateDeviceId();
      const deviceName = getDeviceName();

      console.log('Registering device:', deviceName, deviceId);
      if (fcmToken) {
        console.log('With FCM token');
      }

      // Register with backend
      const response = await deviceAPI.registerDevice(deviceName, deviceId, fcmToken);

      console.log('Device registered successfully:', response);
      return { deviceId, deviceName, fcmToken, ...response };
    } catch (error) {
      console.error('Device registration error:', error);
      throw error;
    }
  },

  async updateStatus(deviceId, batteryLevel, location, fcmToken = null) {
    try {
      await deviceAPI.updateDeviceStatus(deviceId, 'online', batteryLevel, location, fcmToken);
    } catch (error) {
      console.error('Status update error:', error);
    }
  },
};
