# Remote Device Control - Web Dashboard

A web-based dashboard for controlling and monitoring your mobile devices remotely.

## Features

- 🔐 **User Authentication** - Secure login and registration
- 📱 **Device Management** - View and control all your registered devices
- 🔔 **Ring Phone** - Trigger phone ring remotely
- 💡 **Flashlight Control** - Turn device flashlight on/off
- 📍 **Location Tracking** - Get real-time device location
- ⏰ **Remote Alarms** - Set alarms on your device from the web
- 🔋 **Battery Monitoring** - Real-time battery level updates
- 📊 **Activity Logs** - Track all commands and device activities
- 🔌 **Real-time Updates** - Socket.io for instant status updates

## Setup

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Configure Environment**

   Edit `.env` file and set your backend URL:

   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

3. **Start Development Server**

   ```bash
   npm start
   ```

   The app will open at [http://localhost:3000](http://localhost:3000)

## Build for Production

```bash
npm run build
```

The optimized production build will be in the `build/` folder.

## Usage

1. **Register/Login** - Create an account or log in with existing credentials
2. **Register Mobile Device** - Install the mobile app and register your device
3. **Control Panel** - Select a device from the sidebar to view controls
4. **Send Commands** - Use the action buttons to control your device
5. **Monitor Activity** - View real-time activity logs at the bottom

## Requirements

- Node.js 14+
- NPM or Yarn
- Running backend server
- Mobile app installed on target device

## Tech Stack

- React 18
- React Router v6
- Axios
- Socket.io Client
- CSS3 with Gradients

## Project Structure

```
frontend/
├── public/           # Static files
├── src/
│   ├── components/   # React components
│   │   ├── DeviceCard.js
│   │   ├── DeviceControl.js
│   │   └── ActivityLog.js
│   ├── context/      # React context (Auth)
│   ├── pages/        # Page components
│   │   ├── Login.js
│   │   ├── Register.js
│   │   └── Dashboard.js
│   ├── services/     # API & Socket services
│   ├── App.js        # Main app component
│   └── index.js      # Entry point
└── package.json
```

## Available Commands

| Command     | Description              |
| ----------- | ------------------------ |
| `npm start` | Start development server |
| `npm build` | Build for production     |
| `npm test`  | Run tests                |

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

MIT
