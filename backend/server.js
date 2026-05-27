require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const { initializeSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const logRoutes = require('./routes/logs');

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/logs', logRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Remote Device Control Server                        ║
║                                                           ║
║   📡 Server running on port ${PORT}                         ║
║   🌐 Environment: ${process.env.NODE_ENV || 'development'}                      ║
║   🔌 Socket.io: Enabled                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = { app, server, io };
