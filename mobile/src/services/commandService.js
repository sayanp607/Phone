import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import { Alert, Vibration, Platform } from 'react-native';
import Constants from 'expo-constants';

// Simple EventEmitter for React Native
class SimpleEventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event, ...args) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

// Check if notifications are available (not in Expo Go for SDK 53+)
const NOTIFICATIONS_AVAILABLE = !Constants.appOwnership || Constants.appOwnership === 'standalone';

// Event emitter for flashlight control
export const flashlightEmitter = new SimpleEventEmitter();

// Configure notification behavior only if available
if (NOTIFICATIONS_AVAILABLE) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn('Notifications not available:', error.message);
  }
}

export const commandService = {
  // Execute incoming command
  async executeCommand(command, payload, socket) {
    console.log('Executing command:', command, payload);

    try {
      let result;

      switch (command) {
        case 'ring':
          result = await this.ringPhone(payload);
          break;
        case 'flashlight_on':
          result = await this.flashlightOn();
          break;
        case 'flashlight_off':
          result = await this.flashlightOff();
          break;
        case 'set_alarm':
          result = await this.setAlarm(payload);
          break;
        case 'location_request':
          result = await this.getLocation();
          break;
        default:
          result = { success: false, message: 'Unknown command' };
      }

      // Send response back via socket
      if (socket) {
        socket.emit('command:response', {
          command,
          status: result.success ? 'success' : 'error',
          message: result.message,
          data: result.data,
        });
      }

      return result;
    } catch (error) {
      console.error('Command execution error:', error);

      if (socket) {
        socket.emit('command:response', {
          command,
          status: 'error',
          message: error.message,
        });
      }

      return { success: false, message: error.message };
    }
  },

  // Ring phone with notification and vibration
  async ringPhone(payload) {
    try {
      // Continuous vibration pattern - ring for 10 seconds
      const vibrationPattern = [0, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500];
      Vibration.vibrate(vibrationPattern, false);

      // Play system notification sound repeatedly
      let notificationCount = 0;
      const maxNotifications = 3;

      const sendNotification = async () => {
        if (notificationCount < maxNotifications) {
          if (NOTIFICATIONS_AVAILABLE) {
            try {
              const { status } = await Notifications.requestPermissionsAsync();
              if (status === 'granted') {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: '📱 Incoming Ring',
                    body: 'Your phone is being rung from the web dashboard!',
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                  },
                  trigger: null,
                });
              }
            } catch (error) {
              console.warn('Notification error:', error);
            }
          }
          notificationCount++;
          if (notificationCount < maxNotifications) {
            setTimeout(sendNotification, 3000);
          }
        }
      };

      sendNotification();

      // Show alert with stop button
      Alert.alert(
        '📱 Remote Ring',
        'Your phone is ringing!\n\nVibration + Notifications for 10 seconds...',
        [
          {
            text: 'Stop',
            onPress: () => {
              Vibration.cancel();
            }
          }
        ]
      );

      return { success: true, message: 'Phone is ringing with vibration and notifications' };
    } catch (error) {
      console.error('Ring phone error:', error);
      // Fallback to vibration only if notifications fail
      Vibration.vibrate([0, 1000, 500, 1000, 500, 1000, 500, 1000, 500, 1000, 500], false);
      return { success: false, message: error.message };
    }
  },

  // Turn flashlight on
  async flashlightOn() {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        return { success: false, message: 'Camera permission not granted' };
      }

      // Emit event to turn on flashlight
      flashlightEmitter.emit('toggleFlashlight', true);

      Alert.alert(
        '💡 Flashlight ON',
        'Flashlight is now turned ON!',
        [{ text: 'OK' }]
      );

      return { success: true, message: 'Flashlight turned on' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Turn flashlight off
  async flashlightOff() {
    try {
      // Emit event to turn off flashlight
      flashlightEmitter.emit('toggleFlashlight', false);

      Alert.alert(
        '🌑 Flashlight OFF',
        'Flashlight is now turned OFF!',
        [{ text: 'OK' }]
      );
      return { success: true, message: 'Flashlight turned off' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Set alarm/reminder
  async setAlarm(payload) {
    try {
      const { time, message } = payload || {};
      const triggerTime = time ? new Date(time) : new Date(Date.now() + 60000); // Default 1 min

      if (NOTIFICATIONS_AVAILABLE) {
        try {
          const { status } = await Notifications.requestPermissionsAsync();

          if (status === 'granted') {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '⏰ Alarm',
                body: message || 'Alarm set from web dashboard',
                sound: true,
                priority: Notifications.AndroidNotificationPriority.MAX,
              },
              trigger: triggerTime,
            });
          } else {
            Alert.alert('⏰ Alarm', `Alarm set for ${triggerTime.toLocaleTimeString()}\n${message || 'Alarm set from web dashboard'}`);
          }
        } catch (error) {
          console.warn('Notification not available, using alert:', error.message);
          Alert.alert('⏰ Alarm', `Alarm set for ${triggerTime.toLocaleTimeString()}\n${message || 'Alarm set from web dashboard'}`);
        }
      } else {
        // Fallback for Expo Go
        Alert.alert('⏰ Alarm', `Alarm would be set for ${triggerTime.toLocaleTimeString()}\nNote: Alarms require a development build.\n${message || 'Alarm set from web dashboard'}`);
      }

      return {
        success: true,
        message: `Alarm set for ${triggerTime.toLocaleTimeString()}`
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Get current location
  async getLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        return { success: false, message: 'Location permission not granted' };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toISOString(),
      };

      return {
        success: true,
        message: 'Location retrieved',
        data: locationData,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
};
