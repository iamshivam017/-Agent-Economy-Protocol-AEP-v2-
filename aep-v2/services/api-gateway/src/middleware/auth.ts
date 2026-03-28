/**
 * Authentication middleware using Lit Protocol
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, AuthenticatedAgent } from '../types';
import { AppError, asyncHandler } from './errorHandler';
import { logger } from '../utils/logger';

// JWT secret for session tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// Lit Protocol PKP verification (simplified - in production, use actual Lit SDK)
const verifyLitSignature = async (
  did: string,
  signature: string,
  message: string
): Promise<boolean> => {
  // TODO: Integrate with actual Lit Protocol SDK
  // This is a placeholder for the actual verification logic
  try {
    // Mock verification - replace with actual Lit SDK call
    return signature.length > 0 && did.startsWith('did:lit:');
  } catch (error) {
    logger.error('Lit signature verification failed', { error, did });
    return false;
  }
};

// Generate session token
export const generateSessionToken = (agent: AuthenticatedAgent): string => {
  return jwt.sign(
    {
      did: agent.did,
      address: agent.address,
      publicKey: agent.publicKey,
      session: agent.session,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

// Verify session token
export const verifySessionToken = (token: string): AuthenticatedAgent => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      did: decoded.did,
      address: decoded.address,
      publicKey: decoded.publicKey,
      session: decoded.session,
    };
  } catch (error) {
    throw error;
  }
};

// Main authentication middleware
export const authMiddleware = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw new AppError(
      'Authentication required',
      401,
      'AUTH_REQUIRED'
    );
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(
      'Invalid authorization format. Use: Bearer <token>',
      401,
      'INVALID_AUTH_FORMAT'
    );
  }

  try {
    // Verify JWT session token
    const agent = verifySessionToken(token);
    
    // Check session expiration
    if (new Date(agent.session.expiresAt) < new Date()) {
      throw new AppError(
        'Session expired',
        401,
        'SESSION_EXPIRED'
      );
    }

    // Attach agent to request
    req.agent = agent;
    
    logger.debug('Authentication successful', { 
      did: agent.did,
      requestId: req.requestId 
    });
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      'Invalid or expired token',
      401,
      'INVALID_TOKEN'
    );
  }
});

// Optional authentication (doesn't fail if no auth)
export const optionalAuth = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return next();
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next();
  }

  try {
    const agent = verifySessionToken(token);
    req.agent = agent;
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed', { error, requestId: req.requestId });
  }
  
  next();
});

// Role-based authorization middleware
export const requireCapability = (capabilities: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.agent) {
      throw new AppError(
        'Authentication required',
        401,
        'AUTH_REQUIRED'
      );
    }

    const hasCapability = capabilities.some(cap => 
      req.agent!.session.capabilities.includes(cap)
    );

    if (!hasCapability) {
      throw new AppError(
        'Insufficient permissions',
        403,
        'FORBIDDEN',
        { required: capabilities }
      );
    }

    next();
  };
};

// Agent authentication endpoint handler
export const authenticateAgent = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { did, signature, message, publicKey, address } = req.body;

  // Validate required fields
  if (!did || !signature || !message || !publicKey || !address) {
    throw new AppError(
      'Missing required fields: did, signature, message, publicKey, address',
      400,
      'MISSING_FIELDS'
    );
  }

  // Verify DID format
  if (!did.startsWith('did:lit:')) {
    throw new AppError(
      'Invalid DID format. Expected did:lit:<identifier>',
      400,
      'INVALID_DID'
    );
  }

  // Verify Lit signature
  const isValid = await verifyLitSignature(did, signature, message);
  
  if (!isValid) {
    throw new AppError(
      'Invalid signature',
      401,
      'INVALID_SIGNATURE'
    );
  }

  // Create agent session
  const sessionExpiry = new Date();
  sessionExpiry.setHours(sessionExpiry.getHours() + 24);

  const agent: AuthenticatedAgent = {
    did,
    address,
    publicKey,
    session: {
      id: crypto.randomUUID(),
      expiresAt: sessionExpiry,
      capabilities: ['agent:read', 'agent:write', 'task:read', 'task:write'],
    },
  };

  // Generate session token
  const token = generateSessionToken(agent);

  logger.info('Agent authenticated', { did, address });

  res.json({
    success: true,
    data: {
      token,
      agent: {
        did: agent.did,
        address: agent.address,
        session: agent.session,
      },
      expiresAt: sessionExpiry,
    },
  });
});

// Refresh session endpoint
export const refreshSession = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  if (!req.agent) {
    throw new AppError(
      'Authentication required',
      401,
      'AUTH_REQUIRED'
    );
  }

  // Create new session
  const sessionExpiry = new Date();
  sessionExpiry.setHours(sessionExpiry.getHours() + 24);

  const agent: AuthenticatedAgent = {
    ...req.agent,
    session: {
      ...req.agent.session,
      id: crypto.randomUUID(),
      expiresAt: sessionExpiry,
    },
  };

  const token = generateSessionToken(agent);

  logger.info('Session refreshed', { did: agent.did });

  res.json({
    success: true,
    data: {
      token,
      expiresAt: sessionExpiry,
    },
  });
});

// Logout endpoint
export const logout = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response
) => {
  // In a stateless JWT system, logout is handled client-side
  // Here we could add token to a blacklist if using stateful sessions
  
  logger.info('Agent logged out', { did: req.agent?.did });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});
