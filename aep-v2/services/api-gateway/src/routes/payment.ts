/**
 * Payment routes
 */

import { Router, Response } from 'express';
import axios from 'axios';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
const PAYMENT_SERVICE = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006';

// Get wallet balance
router.get('/balance', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { token, chain } = req.query;
  
  const response = await axios.get(`${PAYMENT_SERVICE}/balance`, {
    params: { token, chain },
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Get transaction history
router.get('/transactions', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { type, status, from, to, page, limit } = req.query;
  
  const response = await axios.get(`${PAYMENT_SERVICE}/transactions`, {
    params: { type, status, from, to, page, limit },
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Get transaction by ID
router.get('/transactions/:txId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { txId } = req.params;
  
  const response = await axios.get(`${PAYMENT_SERVICE}/transactions/${txId}`, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Create escrow
router.post('/escrow', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await axios.post(`${PAYMENT_SERVICE}/escrow`, req.body, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.status(201).json(response.data);
}));

// Get escrow details
router.get('/escrow/:escrowId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { escrowId } = req.params;
  
  const response = await axios.get(`${PAYMENT_SERVICE}/escrow/${escrowId}`, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Release escrow
router.post('/escrow/:escrowId/release', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { escrowId } = req.params;
  
  const response = await axios.post(`${PAYMENT_SERVICE}/escrow/${escrowId}/release`, req.body, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Refund escrow
router.post('/escrow/:escrowId/refund', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { escrowId } = req.params;
  
  const response = await axios.post(`${PAYMENT_SERVICE}/escrow/${escrowId}/refund`, req.body, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Stake tokens
router.post('/stake', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await axios.post(`${PAYMENT_SERVICE}/stake`, req.body, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.status(201).json(response.data);
}));

// Unstake tokens
router.post('/unstake', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await axios.post(`${PAYMENT_SERVICE}/unstake`, req.body, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Get staking info
router.get('/staking', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await axios.get(`${PAYMENT_SERVICE}/staking`, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

// Get supported tokens
router.get('/tokens', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const response = await axios.get(`${PAYMENT_SERVICE}/tokens`, {
    headers: {
      'X-Request-ID': req.requestId,
      'X-Agent-DID': req.agent!.did,
    },
  });

  res.json(response.data);
}));

export { router as paymentRouter };
