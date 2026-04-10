const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const db = require('./config/database');
const leadRoutes = require('./routes/leads');
const agentRoutes = require('./routes/agents');
const dashboardRoutes = require('./routes/dashboard');
const assignmentRoutes = require('./routes/assignment');
const aiRoutes = require('./routes/ai');
const assignmentService = require('./services/assignmentService');
const schedulerService = require('./services/schedulerService');
const automationService = require('./services/leadLifecycleAutomationService');
const autoReassignService = require('./services/autoReassignService');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// Routes
app.use('/api/leads', leadRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assignment', assignmentRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });

  socket.on('join-room', (room) => {
    socket.join(room);
    logger.info(`Socket ${socket.id} joined room: ${room}`);
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database connection
    const { initializeDatabase } = require('./config/database');
    await initializeDatabase();
    
    // Test database connection (this will work with in-memory fallback too)
    await db.query('SELECT 1');
    logger.info('Database connected successfully');

    // Start auto-reassign service
    autoReassignService.start(io);
    
    // Start scheduler service for advanced assignment logic
    schedulerService.start();
    
    // Start automation service (run every hour)
    setInterval(async () => {
      try {
        await automationService.processAutomationRules();
      } catch (error) {
        logger.error('Error in scheduled automation processing:', error);
      }
    }, 60 * 60 * 1000); // 1 hour

    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  schedulerService.stop();
  server.close(() => {
    db.end();
    process.exit(0);
  });
});

module.exports = { app, io };
