// Simple Express server without complex dependencies
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

console.log('Starting simple Express server...');

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic routes
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'OK', 
    message: 'Simple server is running',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error middleware:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Enhanced error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Stack trace:', err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  console.error('Stack trace:', err.stack);
});

// Start server
console.log('Attempting to start server...');
const server = app.listen(PORT, () => {
  console.log(`✅ Simple server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Test endpoint: http://localhost:${PORT}/test`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
});

// Keepalive to check if server stays running
let counter = 0;
setInterval(() => {
  counter++;
  console.log(`⏰ Server alive check #${counter} - ${new Date().toISOString()}`);
}, 10000);

console.log('Server setup complete');