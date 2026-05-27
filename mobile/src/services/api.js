import axios from 'axios';
import { storage } from '../utils/storage';

// Use your computer's local IP address
// Find it using: ipconfig (Windows) or ifconfig (Mac/Linux)
const API_URL = process.env.API_URL || 'http://192.168.29.145:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.message || 'Server error');
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An error occurred');
    }
  }
);

export const authAPI = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),

  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  getMe: () =>
    api.get('/auth/me'),
};

export const deviceAPI = {
  registerDevice: (deviceName, deviceId, fcmToken = null) =>
    api.post('/devices/register', { deviceName, deviceId, fcmToken }),

  getDevices: () =>
    api.get('/devices'),

  updateDeviceStatus: (deviceId, status, batteryLevel, location, fcmToken = null) =>
    api.put(`/devices/${deviceId}/status`, { status, batteryLevel, location, fcmToken }),
};

export default api;
