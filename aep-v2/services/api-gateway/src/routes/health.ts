/**
 * Health check routes
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import axios from 'axios';

const router = Router();

// Service health check endpoints
const SERVICES = {
  agent: process.env.AGENT_SERVICE_URL || 'http://localhost:3001',
  task: process.env.TASK_SERVICE_URL || 'http://localhost:3002',
  execution: process.env.EXECUTION_SERVICE_URL || 'http://localhost:3003',
  reputation: process.env.REPUTATION_SERVICE_URL || 'http://localhost:3004',
  storage: process.env.STORAGE_SERVICE_URL || 'http://localhost:3005',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
};

// Basic health check
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'aep-api-gateway',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// Detailed health check with service status
router.get('/detailed', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const serviceChecks = await Promise.allSettled(
    Object.entries(SERVICES).map(async ([name, url]) => {
      try {
        const response = await axios.get(`${url}/health`, {
          timeout: 5000,
        });
        return {
          name,
          url,
          status: 'healthy',
          response: response.data,
        };
      } catch (error) {
        return {
          name,
          url,
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    })
  );

  const services = serviceChecks.map((check, index) => {
    const name = Object.keys(SERVICES)[index];
    if (check.status === 'fulfilled') {
      return check.value;
    }
    return {
      name,
      status: 'error',
      error: check.reason,
    };
  });

  const allHealthy = services.every(s => s.status === 'healthy');

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    data: {
      status: allHealthy ? 'healthy' : 'degraded',
      service: 'aep-api-gateway',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
    },
  }));
}));

// Readiness probe
router.get('/ready', (req: AuthenticatedRequest, res: Response) => {
  // Check critical dependencies
  const ready = true; // Add actual checks

  res.status(ready ? 200 : 503).json({
    success: ready,
    data: {
      ready,
      timestamp: new Date().toISOString(),
    },
  });
});

// Liveness probe
router.get('/live', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      alive: true,
      timestamp: new Date().toISOString(),
    },
  });
});

export { router as healthRouter };
