# Remote Smart Device Control Platform - Backend

A secure, real-time backend server for controlling and monitoring smartphones remotely via web dashboard. Built with Node.js, Express, MongoDB, and Socket.io.

## 🚀 Features

- **JWT Authentication** - Secure user registration and login
- **Device Management** - Pair and manage multiple devices per user
- **Real-Time Communication** - Socket.io for instant command routing
- **Activity Logging** - Track all device commands and events
- **RESTful API** - Clean, documented API endpoints
- **Scalable Architecture** - Ready for production deployment

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## 🛠 Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - A strong secret key for JWT tokens
   - `CORS_ORIGINS` - Allowed frontend URLs (comma-separated)

4. **Start the server**
   
   Development mode (with auto-restart):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

## 📡 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

### Device Management

#### Register Device
```http
POST /api/devices/register
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "deviceName": "My Phone",
  "deviceId": "unique-device-identifier"
}
```

#### Get All Devices
```http
GET /api/devices
Authorization: Bearer <JWT_TOKEN>
```

#### Get Single Device
```http
GET /api/devices/:id
Authorization: Bearer <JWT_TOKEN>
```

#### Update Device Status
```http
PUT /api/devices/:id/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "online",
  "batteryLevel": 85,
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
```

#### Delete Device
```http
DELETE /api/devices/:id
Authorization: Bearer <JWT_TOKEN>
```

### Activity Logs

#### Get Activity Logs
```http
GET /api/logs?deviceId=xxx&startDate=2024-01-01&limit=50&page=1
Authorization: Bearer <JWT_TOKEN>
```

## 🔌 Socket.io Events

### Client Connection

**Web Client:**
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN',
    clientType: 'web'
  }
});
```

**Mobile Device:**
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'YOUR_JWT_TOKEN',
    clientType: 'device',
    deviceId: 'unique-device-id'
  }
});
```

### Events from Web Client

#### Send Command to Device
```javascript
socket.emit('command:send', {
  deviceId: 'device-id',
  command: 'ring', // or 'flashlight', 'alarm', 'location'
  payload: { duration: 5000 }
});
```

#### Request Device Status
```javascript
socket.emit('device:requestStatus');
```

### Events from Mobile Device

#### Send Status Update
```javascript
socket.emit('device:status', {
  batteryLevel: 85,
  location: {
    latitude: 40.7128,
    longitude: -74.0060
  }
});
```

#### Send Command Response
```javascript
socket.emit('command:response', {
  command: 'ring',
  status: 'success',
  message: 'Phone is ringing'
});
```

### Events Received by Web Client

```javascript
// Device status update
socket.on('device:statusUpdate', (data) => {
  console.log('Device status:', data);
});

// Command response
socket.on('command:response', (data) => {
  console.log('Command response:', data);
});

// Device went offline
socket.on('device:offline', (data) => {
  console.log('Device offline:', data.deviceId);
});

// Command sent confirmation
socket.on('command:sent', (data) => {
  console.log('Command sent:', data);
});

// Command error
socket.on('command:error', (data) => {
  console.error('Command error:', data);
});
```

### Events Received by Mobile Device

```javascript
// Execute command
socket.on('command:execute', (data) => {
  const { command, payload } = data;
  // Execute the command (ring, flashlight, etc.)
});

// Get status request
socket.on('device:getStatus', () => {
  // Send current device status
  socket.emit('device:status', { ... });
});
```

## 🏗 Project Structure

```
backend/
├── config/
│   ├── db.js              # MongoDB connection
│   └── socket.js          # Socket.io configuration
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── deviceController.js # Device management logic
│   └── logController.js   # Activity logging logic
├── middleware/
│   ├── auth.js            # JWT authentication middleware
│   └── errorHandler.js    # Global error handler
├── models/
│   ├── User.js            # User schema
│   ├── Device.js          # Device schema
│   └── ActivityLog.js     # Activity log schema
├── routes/
│   ├── auth.js            # Auth routes
│   ├── devices.js         # Device routes
│   └── logs.js            # Log routes
├── utils/
│   └── tokenUtils.js      # JWT utilities
├── .env                   # Environment variables
├── .env.example           # Environment template
├── .gitignore
├── package.json
└── server.js              # Main server file
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

## 🚀 Deployment

### MongoDB Atlas Setup
1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Get your connection string
3. Update `MONGODB_URI` in `.env`

### Deploy to Render/Railway
1. Push code to GitHub
2. Connect repository to Render/Railway
3. Set environment variables
4. Deploy

### Environment Variables for Production
- `NODE_ENV=production`
- `MONGODB_URI=<your-mongodb-atlas-uri>`
- `JWT_SECRET=<strong-random-secret>`
- `CORS_ORIGINS=<your-frontend-url>`
- `PORT=5000`

## 📝 Command Types

The system supports these commands:

- **ring** - Make the phone ring
- **flashlight_on** - Turn flashlight on
- **flashlight_off** - Turn flashlight off
- **set_alarm** - Set an alarm
- **location_request** - Request current GPS location

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- CORS protection
- Input validation
- Protected routes
- Socket.io authentication

## 🤝 Contributing

This is the backend component of the Remote Smart Device Control Platform. Next steps:
1. Build the web dashboard (React)
2. Build the mobile app (React Native)
3. Integrate ML analytics (Python)

## 📄 License

ISC

## 👨‍💻 Author

Built for remote device control and monitoring
