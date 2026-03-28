/**
 * AEP v2 - Task Service
 * Manages task marketplace, bidding, and lifecycle
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { MongoClient, Db } from 'mongodb';

import { logger } from './utils/logger';
import { taskRouter } from './routes/tasks';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3002;

// MongoDB connection
let db: Db;

const connectDB = async () => {
  const client = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017/aep');
  await client.connect();
  db = client.db();
  logger.info('Connected to MongoDB');
  return { client, db };
};

export { db };

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

// Request ID
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] as string || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'task-service',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/tasks', taskRouter);

// Error handler
app.use((err: any, req: any, res: any, _next: any) => {
  logger.error('Error', { error: err.message });
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
    },
  });
});

// Start server
const startServer = async () => {
  try {
    const { client } = await connectDB();
    
    app.listen(PORT, () => {
      logger.info(`📋 Task Service running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await client.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
