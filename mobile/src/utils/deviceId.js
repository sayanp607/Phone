import * as Device from 'expo-device';
import uuid from 'react-native-uuid';
import { storage } from './storage';

export const generateDeviceId = async () => {
  // Check if device ID already exists
  const existingId = await storage.getDeviceId();
  if (existingId) {
    return existingId;
  }

  // Generate new unique device ID
  const deviceInfo = {
    brand: Device.brand || 'Unknown',
    manufacturer: Device.manufacturer || 'Unknown',
    modelName: Device.modelName || 'Unknown',
    osName: Device.osName || 'Unknown',
    osVersion: Device.osVersion || 'Unknown',
  };

  // Create unique ID combining device info and UUID
  const uniqueId = `${deviceInfo.manufacturer}-${deviceInfo.modelName}-${uuid.v4()}`;

  // Save for future use
  await storage.saveDeviceId(uniqueId);

  return uniqueId;
};

export const getDeviceName = () => {
  const manufacturer = Device.manufacturer || 'Unknown';
  const modelName = Device.modelName || 'Device';
  return `${manufacturer} ${modelName}`;
};
