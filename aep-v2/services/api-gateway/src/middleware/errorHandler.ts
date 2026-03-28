/**
 * Global error handler middleware
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiError } from '../types';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: AuthenticatedRequest,
  res: Response,
  _next: NextFunction
) => {
  const requestLogger = logger.child({ requestId: req.requestId });

  // Default error values
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: Record<string, any> | undefined;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  }
  // Handle validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  }
  // Handle syntax errors (malformed JSON)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  }

  // Log error
  if (statusCode >= 500) {
    requestLogger.error('Server error', {
      error: err.message,
      stack: err.stack,
      code: errorCode,
      path: req.path,
      method: req.method,
    });
  } else {
    requestLogger.warn('Client error', {
      error: err.message,
      code: errorCode,
      statusCode,
      path: req.path,
      method: req.method,
    });
  }

  // Send response
  const errorResponse: { success: false; error: ApiError } = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
    },
  };

  res.status(statusCode).json(errorResponse);
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
