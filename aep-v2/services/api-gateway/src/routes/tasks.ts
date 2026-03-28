/**
 * Task routes
 */

import { Router, Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { schemas, validate } from '../middleware/validator';

const router = Router();
const TASK_SERVICE = process.env.TASK_SERVICE_URL || 'http://localhost:3002';

// List tasks
router.get('/', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { 
    q, 
    type, 
    status, 
    minBudget, 
    maxBudget, 
    creator, 
    assignedTo,
    page, 
    limit,
    sortBy,
    sortOrder 
  } = req.query;
  
  const response = await axios.get(`${TASK_SERVICE}/tasks`, {
    params: { 
      q, type, status, minBudget, maxBudget, creator, assignedTo,
      page, limit, sortBy, sortOrder 
    },
    headers: {
      'X-Request-ID': req.requestId,
      ...(req.agent && { 'X-Agent-DID': req.agent.did }),
    },
  });

  res.json(response.data);
}));

// Get task by ID
router.get('/:taskId', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  
  const response = await axios.get(`${TASK_SERVICE}/tasks/${taskId}`, {
    headers: {
      'X-Request-ID': req.requestId,
      ...(req.agent && { 'X-Agent-DID': req.agent.did }),
    },
  });

  res.json(response.data);
}));

// Create new task
router.post('/',
  optionalAuth,
  validate({ body: schemas.task.create }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const response = await axios.post(`${TASK_SERVICE}/tasks`, req.body, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.status(201).json(response.data);
  })
);

// Update task
router.patch('/:taskId',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    
    const response = await axios.patch(`${TASK_SERVICE}/tasks/${taskId}`, req.body, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.json(response.data);
  })
);

// Cancel task
router.post('/:taskId/cancel',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    
    const response = await axios.post(`${TASK_SERVICE}/tasks/${taskId}/cancel`, req.body, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.json(response.data);
  })
);

// Get task bids
router.get('/:taskId/bids', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { taskId } = req.params;
  
  const response = await axios.get(`${TASK_SERVICE}/tasks/${taskId}/bids`, {
    headers: {
      'X-Request-ID': req.requestId,
      ...(req.agent && { 'X-Agent-DID': req.agent.did }),
    },
  });

  res.json(response.data);
}));

// Place bid on task
router.post('/:taskId/bids',
  optionalAuth,
  validate({ body: schemas.task.bid }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    
    const response = await axios.post(`${TASK_SERVICE}/tasks/${taskId}/bids`, req.body, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.status(201).json(response.data);
  })
);

// Accept bid
router.post('/:taskId/bids/:bidId/accept',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId, bidId } = req.params;
    
    const response = await axios.post(`${TASK_SERVICE}/tasks/${taskId}/bids/${bidId}/accept`, {}, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.json(response.data);
  })
);

// Reject bid
router.post('/:taskId/bids/:bidId/reject',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId, bidId } = req.params;
    
    const response = await axios.post(`${TASK_SERVICE}/tasks/${taskId}/bids/${bidId}/reject`, {}, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.json(response.data);
  })
);

// Withdraw bid
router.post('/:taskId/bids/:bidId/withdraw',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId, bidId } = req.params;
    
    const response = await axios.post(`${TASK_SERVICE}/tasks/${taskId}/bids/${bidId}/withdraw`, {}, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.json(response.data);
  })
);

// Submit task result
router.post('/:taskId/submit',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    
    const response = await axios.post(`${TASK_SERVICE}/tasks/${taskId}/submit`, req.body, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.json(response.data);
  })
);

// Approve task result
router.post('/:taskId/approve',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    
    const response = await axios.post(`${TASK_SERVICE}/tasks/${taskId}/approve`, req.body, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.json(response.data);
  })
);

// Dispute task
router.post('/:taskId/dispute',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    
    const response = await axios.post(`${TASK_SERVICE}/tasks/${taskId}/dispute`, req.body, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.json(response.data);
  })
);

// Get task execution logs
router.get('/:taskId/execution',
  optionalAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { taskId } = req.params;
    
    const response = await axios.get(`${TASK_SERVICE}/tasks/${taskId}/execution`, {
      headers: {
        'X-Request-ID': req.requestId,
        ...(req.agent && { 'X-Agent-DID': req.agent.did }),
      },
    });

    res.json(response.data);
  })
);

// Get task categories/stats
router.get('/stats/categories', optionalAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await axios.get(`${TASK_SERVICE}/stats/categories`, {
    headers: {
      'X-Request-ID': req.requestId,
      ...(req.agent && { 'X-Agent-DID': req.agent.did }),
    },
  });

  res.json(response.data);
}));

export { router as tasksRouter };
