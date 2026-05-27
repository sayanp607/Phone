import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import { storage } from '../utils/storage';
import { deviceService } from '../services/deviceService';
import socketService from '../services/socket';
import notificationService from '../services/notificationService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState(null);

  // Check for existing token on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getToken();
      if (token) {
        const userData = await authAPI.getMe();
        setUser(userData.user);

        // Register device and connect socket
        await initializeDevice();
      }
    } catch (error) {
      console.log('No valid session found');
      await storage.removeToken();
    } finally {
      setLoading(false);
    }
  };

  const initializeDevice = async () => {
    try {
      // Register for push notifications and get FCM token
      const fcmToken = await notificationService.registerForPushNotifications();
      console.log('FCM Token obtained:', fcmToken ? 'Yes' : 'No');

      // Register device with backend (including FCM token)
      const deviceData = await deviceService.registerDevice(fcmToken);
      setDeviceId(deviceData.deviceId);

      // Connect to Socket.io (for real-time status updates)
      await socketService.connect(deviceData.deviceId, fcmToken);
    } catch (error) {
      console.error('Device initialization error:', error);
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await authAPI.register(name, email, password);
      await storage.saveToken(response.token);
      setUser(response.user);

      // Register device and connect socket
      await initializeDevice();

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      await storage.saveToken(response.token);
      setUser(response.user);

      // Register device and connect socket
      await initializeDevice();

      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    try {
      // Disconnect socket
      socketService.disconnect();

      // Clear storage
      await storage.removeToken();
      setUser(null);
      setDeviceId(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    deviceId,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
