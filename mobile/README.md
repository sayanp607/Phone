# Remote Device Control - Mobile App

React Native mobile application for receiving and executing remote commands from the web dashboard.

## 🚀 Features

- **User Authentication** - Login/Register with JWT
- **Device Registration** - Auto-register device on first login
- **Real-Time Commands** - Receive commands via Socket.io
- **Command Execution**:
  - 📱 Ring Phone (notification + vibration)
  - 🔦 Flashlight Control
  - ⏰ Set Alarm
  - 📍 Share GPS Location
- **Connection Status** - Real-time connection monitoring
- **Battery Reporting** - Automatic battery level updates

## 📋 Prerequisites

- Node.js (v18+)
- Expo CLI: `npm install -g expo-cli`
- Android device or emulator (iOS also supported)
- Backend server running

## 🛠 Installation

1. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure backend URL**
   
   Edit `.env` file and replace with your computer's local IP:
   ```
   API_URL=http://YOUR_IP_ADDRESS:5000
   SOCKET_URL=http://YOUR_IP_ADDRESS:5000
   ```
   
   To find your IP:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` (look for inet)

4. **Start the app**
   ```bash
   npm start
   ```

5. **Run on device**
   - Scan QR code with Expo Go app (Android/iOS)
   - Or press `a` for Android emulator
   - Or press `i` for iOS simulator

## 📱 Usage

1. **Register/Login**
   - Create account or login with existing credentials
   - Use the SAME account as your web dashboard

2. **Device Auto-Registration**
   - App automatically registers your device
   - Connects to backend via Socket.io

3. **Keep App Running**
   - Keep app in foreground or background
   - App maintains connection to receive commands

4. **Receive Commands**
   - Commands sent from web dashboard execute automatically
   - Notifications show command results

## 🔒 Permissions

The app will request these permissions when needed:

- **Camera** - For flashlight control
- **Location** - For GPS location sharing
- **Notifications** - For ring command and alarms

## 📂 Project Structure

```
mobile/
├── src/
│   ├── context/
│   │   └── AuthContext.js       # Authentication state
│   ├── navigation/
│   │   └── AppNavigator.js      # Navigation setup
│   ├── screens/
│   │   ├── LoginScreen.js       # Login UI
│   │   ├── RegisterScreen.js    # Registration UI
│   │   └── HomeScreen.js        # Main status screen
│   ├── services/
│   │   ├── api.js               # API calls
│   │   ├── socket.js            # Socket.io client
│   │   ├── deviceService.js     # Device registration
│   │   └── commandService.js    # Command execution
│   └── utils/
│       ├── storage.js           # AsyncStorage helpers
│       └── deviceId.js          # Device ID generation
├── App.js                       # Root component
├── app.json                     # Expo configuration
└── package.json
```

## 🎯 Available Commands

| Command | Description | Permission Required |
|---------|-------------|---------------------|
| `ring` | Ring phone with notification | Notifications |
| `flashlight_on` | Turn flashlight on | Camera |
| `flashlight_off` | Turn flashlight off | Camera |
| `set_alarm` | Set alarm/reminder | Notifications |
| `location_request` | Get GPS location | Location |

## 🔧 Troubleshooting

### Cannot connect to backend
- Ensure backend server is running
- Check that `.env` has correct IP address
- Make sure phone and computer are on same network
- Try disabling firewall temporarily

### Permissions not working
- Go to phone Settings → Apps → Remote Device Control
- Manually enable required permissions

### App crashes on command
- Check backend server logs
- Ensure all permissions are granted
- Restart the app

## 🚀 Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

## 📝 Notes

- **Background Service**: Limited on iOS, works better on Android
- **Flashlight**: Requires platform-specific native modules for full control
- **Battery Optimization**: May affect background connection on some devices

## 🤝 Next Steps

1. Build the web dashboard to send commands
2. Test end-to-end command execution
3. Optimize battery usage
4. Add more commands as needed

## 📄 License

ISC
