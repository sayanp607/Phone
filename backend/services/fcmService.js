const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
const serviceAccount = require(path.join(__dirname, '../firebase-service-account.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Send command to device via FCM push notification
 * @param {string} fcmToken - Device FCM token
 * @param {string} command - Command to execute (ring, flashlight_on, etc.)
 * @param {object} payload - Additional command data
 * @returns {Promise<object>} - Result of FCM send operation
 */
async function sendCommandToDevice(fcmToken, command, payload = {}) {
  try {
    if (!fcmToken) {
      throw new Error('FCM token is required');
    }

    const message = {
      data: {
        command,
        payload: JSON.stringify(payload),
        timestamp: new Date().toISOString(),
      },
      token: fcmToken,
      android: {
        priority: 'high',
        ttl: 60000, // 60 seconds
      },
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ FCM message sent successfully to ${command}:`, response);

    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error('❌ FCM send error:', error);
    throw error;
  }
}

/**
 * Send command to multiple devices
 * @param {Array<string>} fcmTokens - Array of device FCM tokens
 * @param {string} command - Command to execute
 * @param {object} payload - Additional command data
 * @returns {Promise<object>} - Result of multicast send
 */
async function sendCommandToMultipleDevices(fcmTokens, command, payload = {}) {
  try {
    if (!fcmTokens || fcmTokens.length === 0) {
      throw new Error('At least one FCM token is required');
    }

    const message = {
      data: {
        command,
        payload: JSON.stringify(payload),
        timestamp: new Date().toISOString(),
      },
      tokens: fcmTokens,
      android: {
        priority: 'high',
        ttl: 60000,
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ FCM multicast sent: ${response.successCount} successful, ${response.failureCount} failed`);

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error) {
    console.error('❌ FCM multicast error:', error);
    throw error;
  }
}

module.exports = {
  sendCommandToDevice,
  sendCommandToMultipleDevices,
};
