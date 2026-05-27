import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { commandService } from './commandService';

class FCMService {
  constructor() {
    this.fcmToken = null;
  }

  // Initialize FCM and request permissions
  async initialize() {
    try {
      // Request permission for notifications
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.warn('FCM: Notification permission not granted');
        return null;
      }

      // Get FCM token
      this.fcmToken = await messaging().getToken();
      console.log('✅ FCM Token obtained:', this.fcmToken);

      // Set up message handlers
      this.setupMessageHandlers();

      return this.fcmToken;
    } catch (error) {
      console.error('FCM initialization error:', error);
      return null;
    }
  }

  // Set up foreground and background message handlers
  setupMessageHandlers() {
    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('📥 FCM foreground message:', remoteMessage);
      await this.handleMessage(remoteMessage);
    });

    // Handle background messages (app closed/background)
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📥 FCM background message:', remoteMessage);
      await this.handleMessage(remoteMessage);
    });

    // Handle notification opened (user tapped notification)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('📱 Notification opened:', remoteMessage);
    });

    // Check if app was opened from a notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('📱 App opened from notification:', remoteMessage);
        }
      });
  }

  // Handle incoming FCM message and execute command
  async handleMessage(remoteMessage) {
    try {
      const { data } = remoteMessage;

      if (!data || !data.command) {
        console.warn('FCM: Invalid message format');
        return;
      }

      const command = data.command;
      const payload = data.payload ? JSON.parse(data.payload) : {};

      console.log(`🔥 Executing FCM command: ${command}`);

      // Execute the command
      await commandService.executeCommand(command, payload, null);

      // Show local notification for feedback
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Command Executed',
          body: `${command} command completed`,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error handling FCM message:', error);
    }
  }

  // Get current FCM token
  getToken() {
    return this.fcmToken;
  }

  // Refresh FCM token
  async refreshToken() {
    try {
      this.fcmToken = await messaging().getToken();
      console.log('✅ FCM Token refreshed:', this.fcmToken);
      return this.fcmToken;
    } catch (error) {
      console.error('Error refreshing FCM token:', error);
      return null;
    }
  }

  // Listen for token refresh
  onTokenRefresh(callback) {
    messaging().onTokenRefresh((token) => {
      console.log('🔄 FCM Token refreshed:', token);
      this.fcmToken = token;
      if (callback) callback(token);
    });
  }
}

export default new FCMService();
