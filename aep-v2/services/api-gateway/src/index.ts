/**
 * AEP v2 - API Gateway
 * Main entry point for the Agent Economy Protocol API Gateway
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { WebSocketServer } from 'ws';
import http from 'http';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { requestValidator } from './middleware/validator';
import { healthRouter } from './routes/health';
import { agentsRouter } from './routes/agents';
import { tasksRouter } from './routes/tasks';
import { executionRouter } from './routes/execution';
import { reputationRouter } from './routes/reputation';
import { paymentRouter } from './routes/payment';
import { WebSocketManager } from './services/websocket';

dotenv.config();

const app: Application = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });
const wsManager = new WebSocketManager(wss);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Stricter rate limit for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: {
    error: 'Too many authentication attempts',
    retryAfter: 900,
  },
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Request context middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.requestId = crypto.randomUUID();
  req.startTime = Date.now();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Service discovery - microservice URLs
const SERVICES = {
  AGENT: process.env.AGENT_SERVICE_URL || 'http://localhost:3001',
  TASK: process.env.TASK_SERVICE_URL || 'http://localhost:3002',
  EXECUTION: process.env.EXECUTION_SERVICE_URL || 'http://localhost:3003',
  REPUTATION: process.env.REPUTATION_SERVICE_URL || 'http://localhost:3004',
  STORAGE: process.env.STORAGE_SERVICE_URL || 'http://localhost:3005',
  PAYMENT: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
};

// Health check (public)
app.use('/health', healthRouter);

// API version prefix
const API_V1 = '/api/v1';

// Public routes
app.use(`${API_V1}/agents`, agentsRouter);
app.use(`${API_V1}/tasks`, tasksRouter);

// Protected routes (require authentication)
app.use(`${API_V1}/execution`, authMiddleware, executionRouter);
app.use(`${API_V1}/reputation`, authMiddleware, reputationRouter);
app.use(`${API_V1}/payment`, authMiddleware, paymentRouter);

// Proxy middleware for microservices
const createServiceProxy = (serviceUrl: string, pathRewrite: Record<string, string> = {}) => {
  return createProxyMiddleware({
    target: serviceUrl,
    changeOrigin: true,
    pathRewrite,
    onError: (err, req, res) => {
      logger.error(`Proxy error: ${err.message}`, { service: serviceUrl });
      res.status(503).json({
        error: 'Service temporarily unavailable',
        service: serviceUrl,
      });
    },
    onProxyReq: (proxyReq, req) => {
      // Forward request ID for tracing
      proxyReq.setHeader('X-Request-ID', req.requestId);
      if (req.agent) {
        proxyReq.setHeader('X-Agent-DID', req.agent.did);
      }
    },
  });
};

// Service proxies (internal use)
app.use('/internal/agent', authMiddleware, createServiceProxy(SERVICES.AGENT));
app.use('/internal/task', authMiddleware, createServiceProxy(SERVICES.TASK));
app.use('/internal/execution', authMiddleware, createServiceProxy(SERVICES.EXECUTION));
app.use('/internal/reputation', authMiddleware, createServiceProxy(SERVICES.REPUTATION));
app.use('/internal/storage', authMiddleware, createServiceProxy(SERVICES.STORAGE));
app.use('/internal/payment', authMiddleware, createServiceProxy(SERVICES.PAYMENT));

// WebSocket upgrade handling
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(() => {
    logger.info('HTTP server closed');
    wsManager.closeAll();
    logger.info('WebSocket connections closed');
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 AEP API Gateway running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready on path /ws`);
  logger.info(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, wsManager };
