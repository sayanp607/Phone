import fcmService from './fcm';

// Register for push notifications and get FCM token
async function registerForPushNotifications() {
  try {
    const fcmToken = await fcmService.initialize();

    if (!fcmToken) {
      console.warn('Failed to get FCM token');
      return null;
    }

    // Listen for token refresh
    fcmService.onTokenRefresh(async (newToken) => {
      console.log('FCM token refreshed, should update backend:', newToken);
      // TODO: Update backend with new token
    });

    return fcmToken;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export default {
  registerForPushNotifications,
};
