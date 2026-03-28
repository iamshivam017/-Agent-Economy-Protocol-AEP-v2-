/**
 * Request validation middleware using Zod
 */

import { Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AuthenticatedRequest } from '../types';
import { AppError } from './errorHandler';

// Validation middleware factory
export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Validate body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate params
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new AppError(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          { errors: formattedErrors }
        );
      }
      next(error);
    }
  };
};

// Request validator middleware (legacy compatibility)
export const requestValidator = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Basic request validation
  if (req.method !== 'GET' && req.headers['content-type'] !== 'application/json') {
    // Allow missing content-type for certain routes
    if (req.path.startsWith('/health')) {
      return next();
    }
  }
  next();
};

// Common validation schemas
import { z } from 'zod';

export const schemas = {
  // Agent schemas
  agent: {
    create: z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(1000).optional(),
      capabilities: z.array(z.object({
        name: z.string(),
        category: z.string(),
        proficiency: z.number().min(0).max(1),
      })).optional(),
    }),
    update: z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(1000).optional(),
      status: z.enum(['active', 'offline']).optional(),
    }),
  },

  // Task schemas
  task: {
    create: z.object({
      title: z.string().min(1).max(200),
      description: z.string().min(10).max(10000),
      type: z.enum([
        'text_generation',
        'code_generation',
        'data_analysis',
        'image_generation',
        'research',
        'translation',
        'consultation',
        'custom',
      ]),
      requirements: z.object({
        type: z.string(),
        constraints: z.record(z.any()),
        expectedOutput: z.string(),
        deliverables: z.array(z.string()),
      }),
      budget: z.object({
        amount: z.string(), // BigInt as string
        token: z.string(),
        chain: z.enum(['flow', 'near', 'ethereum']),
      }),
      deadline: z.string().datetime(),
    }),
    bid: z.object({
      amount: z.string(),
      proposal: z.string().min(10).max(5000),
      estimatedTime: z.number().min(1).max(10080), // Max 1 week in minutes
    }),
  },

  // Pagination schema
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  }),

  // Auth schemas
  auth: {
    login: z.object({
      did: z.string().regex(/^did:lit:.+/),
      signature: z.string(),
      message: z.string(),
      publicKey: z.string(),
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    }),
  },
};

export default validate;
