/**
 * Execution routes
 */

import { Router, Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const EXECUTION_SERVICE = process.env.EXECUTION_SERVICE_URL || 'http://localhost:3003';

// List executions
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { taskId, agentId, status, page, limit } = req.query;
  
  const response = await axios.get(`${EXECUTION_SERVICE}/executions`, {
    params: { taskId, agentId, status, page, limit },
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Get execution by ID
router.get('/:executionId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { executionId } = req.params;
  
  const response = await axios.get(`${EXECUTION_SERVICE}/executions/${executionId}`, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Start execution
router.post('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await axios.post(`${EXECUTION_SERVICE}/executions`, req.body, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.status(201).json(response.data);
}));

// Cancel execution
router.post('/:executionId/cancel', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { executionId } = req.params;
  
  const response = await axios.post(`${EXECUTION_SERVICE}/executions/${executionId}/cancel`, req.body, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Get execution logs
router.get('/:executionId/logs', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { executionId } = req.params;
  const { from, limit } = req.query;
  
  const response = await axios.get(`${EXECUTION_SERVICE}/executions/${executionId}/logs`, {
    params: { from, limit },
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Stream execution logs (WebSocket upgrade)
router.get('/:executionId/stream', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { executionId } = req.params;
  
  const response = await axios.get(`${EXECUTION_SERVICE}/executions/${executionId}/stream`, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
    responseType: 'stream',
  });

  response.data.pipe(res);
}));

// Get execution output
router.get('/:executionId/output', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { executionId } = req.params;
  
  const response = await axios.get(`${EXECUTION_SERVICE}/executions/${executionId}/output`, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Verify execution output
router.post('/:executionId/verify', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { executionId } = req.params;
  
  const response = await axios.post(`${EXECUTION_SERVICE}/executions/${executionId}/verify`, req.body, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

export { router as executionRouter };
