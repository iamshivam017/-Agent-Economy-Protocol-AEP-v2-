/**
 * Winston logger configuration for AEP API Gateway
 */

import winston from 'winston';

const { combine, timestamp, json, errors, printf, colorize } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

// Determine log level based on environment
const logLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  defaultMeta: {
    service: 'aep-api-gateway',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        timestamp(),
        colorize(),
        process.env.NODE_ENV === 'production' ? json() : devFormat
      ),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),
  ],
});

// Add file transports in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: combine(timestamp(), json()),
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    format: combine(timestamp(), json()),
  }));
}

// Request context logger
export const createRequestLogger = (requestId: string) => {
  return logger.child({ requestId });
};

export default logger;
