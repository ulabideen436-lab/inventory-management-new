import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { WebSocketServer } from 'ws';
import { apiLimiter, authLimiter, authenticateJWT, securityHeaders } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import dashboardRoutes from './routes/dashboard.js';
import deletedItemsRoutes from './routes/deletedItems.js';
import exportRoutes from './routes/export.js';
import paymentRoutes from './routes/payments.js';
import productRoutes from './routes/products.js';
import purchaseRoutes from './routes/purchases.js';
import reportRoutes from './routes/reports.js';
import salesRoutes from './routes/sales.js';
import settingsRoutes from './routes/settings.js';
import supplierRoutes from './routes/suppliers.js';
import transactionsRoutes from './routes/transactions.js';
import userRoutes from './routes/users.js';

dotenv.config();
const app = express();

// Basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(securityHeaders);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to all routes
app.use(apiLimiter);

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/backup', authenticateJWT, exportRoutes);
app.use('/customers', authenticateJWT, customerRoutes);
app.use('/dashboard', authenticateJWT, dashboardRoutes);
app.use('/deleted-items', authenticateJWT, deletedItemsRoutes);
app.use('/export', authenticateJWT, exportRoutes);
app.use('/payments', authenticateJWT, paymentRoutes);
app.use('/products', authenticateJWT, productRoutes);
app.use('/purchases', authenticateJWT, purchaseRoutes);
app.use('/reports', authenticateJWT, reportRoutes);
app.use('/sales', authenticateJWT, salesRoutes);
app.use('/settings', authenticateJWT, settingsRoutes);
app.use('/suppliers', authenticateJWT, supplierRoutes);
app.use('/transactions', authenticateJWT, transactionsRoutes);
app.use('/users', authenticateJWT, userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

const PORT = process.env.PORT || 5000;

// Add error handling for startup
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Stack trace:', err.stack);
  // Don't exit immediately, let server try to recover
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  console.error('Stack trace:', err.stack);
  // Don't exit immediately, let server try to recover
  setTimeout(() => process.exit(1), 1000);
});

const server = app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`Server accessible at: http://localhost:${PORT}`);
  console.log(`Server accessible at: http://127.0.0.1:${PORT}`);
  console.log('Server startup completed successfully');

  // Initialize WebSocket server
  initializeWebSocketServer();
}).on('error', (err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});

// WebSocket server initialization
function initializeWebSocketServer() {
  const WS_PORT = 3001;
  const wss = new WebSocketServer({ port: WS_PORT, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    const url = req.url || '';
    const origin = req.headers && req.headers.origin;
    const ua = req.headers && req.headers['user-agent'];
    const proto = req.headers && req.headers['sec-websocket-protocol'];
    console.log('WS connection:', { ip, url, origin, ua, proto });

    // If the connection doesn't look like our intended client, close it to avoid
    // sending unexpected plain-text messages to e.g. webpack HMR / dev sockets.
    const lowerUA = (ua || '').toLowerCase();
    const looksLikeHMR = lowerUA.includes('webpack') || lowerUA.includes('sockjs') || (proto || '').toLowerCase().includes('sockjs');
    if (url !== '/ws' || looksLikeHMR) {
      console.log('Rejecting non-matching or HMR-like connection from', ip, url, ua);
      try { ws.close(1000, 'rejecting non-app client'); } catch (e) { /* ignore */ }
      return;
    }

    console.log('Accepted app WS client from', ip);

    ws.on('message', (message) => {
      const text = message.toString();
      console.log('received from client:', text);
      // Try to parse JSON and broadcast to all connected app clients
      try {
        let parsed;
        try { parsed = JSON.parse(text); } catch (e) { parsed = { message: text }; }
        const payload = JSON.stringify(parsed);
        // Broadcast to all connected clients
        wss.clients.forEach(client => {
          if (client.readyState === client.OPEN) {
            try { client.send(payload); } catch (err) { /* ignore send errors */ }
          }
        });
      } catch (e) {
        console.error('Failed to broadcast message:', e.message);
      }
    });

    // Send an initial JSON message
    try {
      ws.send(JSON.stringify({ message: 'welcome', info: 'WebSocket server ready' }));
    } catch (e) {
      console.error('Failed to send welcome message:', e.message);
    }
  });

  console.log(`WebSocket server running on ws://localhost:${WS_PORT}/ws`);
}

// Add keepalive
setInterval(() => {
  console.log('Server is running at', new Date().toISOString());
}, 30000);

// Export for Vercel serverless
export default app;
