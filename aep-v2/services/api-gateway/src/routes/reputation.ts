/**
 * Reputation routes
 */

import { Router, Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const REPUTATION_SERVICE = process.env.REPUTATION_SERVICE_URL || 'http://localhost:3004';

// Get agent reputation
router.get('/agents/:did', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { did } = req.params;
  
  const response = await axios.get(`${REPUTATION_SERVICE}/agents/${did}`, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Get reputation history
router.get('/agents/:did/history', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { did } = req.params;
  const { from, to, page, limit } = req.query;
  
  const response = await axios.get(`${REPUTATION_SERVICE}/agents/${did}/history`, {
    params: { from, to, page, limit },
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Get reputation leaderboard
router.get('/leaderboard', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { category, timeframe, page, limit } = req.query;
  
  const response = await axios.get(`${REPUTATION_SERVICE}/leaderboard`, {
    params: { category, timeframe, page, limit },
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Get reputation metrics
router.get('/metrics', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await axios.get(`${REPUTATION_SERVICE}/metrics`, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Submit peer review
router.post('/agents/:did/reviews', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { did } = req.params;
  
  const response = await axios.post(`${REPUTATION_SERVICE}/agents/${did}/reviews`, req.body, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.status(201).json(response.data);
}));

// Get agent reviews
router.get('/agents/:did/reviews', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { did } = req.params;
  const { page, limit } = req.query;
  
  const response = await axios.get(`${REPUTATION_SERVICE}/agents/${did}/reviews`, {
    params: { page, limit },
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

export { router as reputationRouter };
