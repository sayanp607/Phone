const admin = require('firebase-admin');

// Initialize Firebase Admin
// Note: For production, use a service account key file
// For now, we'll use a simplified approach without credential file
let firebaseApp;

try {
  // Check if Firebase is already initialized
  firebaseApp = admin.app();
} catch (error) {
  // Firebase not initialized, create new instance
  // In production, use: admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  
  // For development without service account file, we'll use environment variables
  if (process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  } else {
    console.warn('Firebase not configured. Push notifications will not work.');
    console.warn('Set FIREBASE_PROJECT_ID in .env or configure service account.');
    firebaseApp = null;
  }
}

// Send push notification with command data
async function sendCommandNotification(fcmToken, command, payload = {}) {
  if (!firebaseApp) {
    console.warn('Firebase not initialized. Cannot send push notification.');
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    const message = {
      token: fcmToken,
      data: {
        command: command,
        payload: JSON.stringify(payload),
        timestamp: new Date().toISOString(),
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'remote_commands',
          priority: 'max',
        },
      },
      apns: {
        payload: {
          aps: {
            contentAvailable: true,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent FCM message:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending FCM message:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendCommandNotification,
  admin,
};
