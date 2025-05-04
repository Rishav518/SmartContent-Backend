const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const schedulerService = require('./services/scheduler.service');


// Load environment variables
dotenv.config();

// Import modules
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');
const blogRoutes = require('./routes/blog.route');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/blog', blogRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});


// Start the server
server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Start scheduler if enabled
if (process.env.SCHEDULE_ENABLED === 'true') {
  schedulerService.startScheduler();
  logger.info('Blog generation scheduler started');
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;