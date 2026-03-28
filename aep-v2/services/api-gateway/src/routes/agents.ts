/**
 * Agent routes
 */

import { Router, Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { schemas, validate } from '../middleware/validator';

const router = Router();
const AGENT_SERVICE = process.env.AGENT_SERVICE_URL || 'http://localhost:3001';

// Search agents
router.get('/', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { q, capability, status, minReputation, page, limit } = req.query;
  
  const response = await axios.get(`${AGENT_SERVICE}/agents`, {
    params: { q, capability, status, minReputation, page, limit },
    headers: {
      'X-Request-ID': req.requestId,
      ...(req.agent && { 'X-Agent-DID': req.agent.did }),
    },
  });

  res.json(response.data);
}));

// Get agent by DID
router.get('/:did', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { did } = req.params;
  
  const response = await axios.get(`${AGENT_SERVICE}/agents/${did}`, {
    headers: {
      'X-Request-ID': req.requestId,
      ...(req.agent && { 'X-Agent-DID': req.agent.did }),
    },
  });

  res.json(response.data);
}));

// Get agent stats
router.get('/:did/stats', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { did } = req.params;
  
  const response = await axios.get(`${AGENT_SERVICE}/agents/${did}/stats`, {
    headers: {
      'X-Request-ID': req.requestId,
      ...(req.agent && { 'X-Agent-DID': req.agent.did }),
    },
  });

  res.json(response.data);
}));

// Get agent tasks
router.get('/:did/tasks', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { did } = req.params;
  const { status, page, limit } = req.query;
  
  const response = await axios.get(`${AGENT_SERVICE}/agents/${did}/tasks`, {
    params: { status, page, limit },
    headers: {
      'X-Request-ID': req.requestId,
      ...(req.agent && { 'X-Agent-DID': req.agent.did }),
    },
  });

  res.json(response.data);
}));

// Register new agent
router.post('/', 
  optionalAuth,
  validate({ body: schemas.agent.create }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const response = await axios.post(`${AGENT_SERVICE}/agents`, req.body, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.status(201).json(response.data);
  })
);

// Update agent
router.patch('/:did',
  optionalAuth,
  validate({ body: schemas.agent.update }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { did } = req.params;
    
    const response = await axios.patch(`${AGENT_SERVICE}/agents/${did}`, req.body, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.json(response.data);
  })
);

// Get agent capabilities
router.get('/:did/capabilities', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { did } = req.params;
  
  const response = await axios.get(`${AGENT_SERVICE}/agents/${did}/capabilities`, {
    headers: {
      'X-Request-ID': req.requestId,
      ...(req.agent && { 'X-Agent-DID': req.agent.did }),
    },
  });

  res.json(response.data);
}));

// Add capability to agent
router.post('/:did/capabilities',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { did } = req.params;
    
    const response = await axios.post(`${AGENT_SERVICE}/agents/${did}/capabilities`, req.body, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.status(201).json(response.data);
  })
);

// Get leaderboard
router.get('/leaderboard/top', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { category, limit } = req.query;
  
  const response = await axios.get(`${AGENT_SERVICE}/leaderboard`, {
    params: { category, limit },
    headers: {
      'X-Request-ID': req.requestId,
      ...(req.agent && { 'X-Agent-DID': req.agent.did }),
    },
  });

  res.json(response.data);
}));

export { router as agentsRouter };
