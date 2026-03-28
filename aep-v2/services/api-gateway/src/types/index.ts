/**
 * Type definitions for AEP API Gateway
 */

import { Request } from 'express';

// Agent types
export interface Agent {
  id: string;
  did: string;
  owner: string;
  name: string;
  description?: string;
  avatar?: string;
  capabilities: Capability[];
  reputation: ReputationScore;
  stake: bigint;
  status: AgentStatus;
  metadata: AgentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface Capability {
  name: string;
  category: string;
  proficiency: number; // 0-1
  verified: boolean;
}

export interface ReputationScore {
  overall: number; // 0-100
  successRate: number;
  completionSpeed: number;
  peerRating: number;
  longevity: number;
}

export type AgentStatus = 'active' | 'busy' | 'offline' | 'suspended';

export interface AgentMetadata {
  version: string;
  runtime: string;
  models: string[];
  tools: string[];
  cid?: string;
}

// Task types
export interface Task {
  id: string;
  taskId: string;
  creator: string; // Agent DID
  title: string;
  description: string;
  type: TaskType;
  requirements: TaskRequirements;
  budget: Budget;
  deadline: Date;
  status: TaskStatus;
  bids: Bid[];
  assignedTo?: string;
  result?: TaskResult;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskType = 
  | 'text_generation'
  | 'code_generation'
  | 'data_analysis'
  | 'image_generation'
  | 'research'
  | 'translation'
  | 'consultation'
  | 'custom';

export type TaskStatus = 
  | 'draft'
  | 'open'
  | 'bidding'
  | 'assigned'
  | 'executing'
  | 'reviewing'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export interface TaskRequirements {
  type: string;
  constraints: Record<string, any>;
  expectedOutput: string;
  deliverables: string[];
}

export interface Budget {
  amount: string; // BigInt as string
  token: string; // Token contract address
  chain: 'flow' | 'near' | 'ethereum';
  escrowId?: string;
}

export interface Bid {
  id: string;
  agentId: string;
  amount: string;
  proposal: string;
  estimatedTime: number; // minutes
  timestamp: Date;
  status: BidStatus;
}

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface TaskResult {
  output: any;
  cid: string;
  verification: VerificationResult;
  deliveredAt: Date;
}

export interface VerificationResult {
  status: 'pending' | 'passed' | 'failed';
  score: number;
  verifier: string;
  feedback?: string;
}

// Execution types
export interface Execution {
  id: string;
  executionId: string;
  taskId: string;
  agentId: string;
  status: ExecutionStatus;
  logs: ExecutionLog[];
  output?: any;
  startedAt: Date;
  completedAt?: Date;
}

export type ExecutionStatus = 
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExecutionLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, any>;
}

// Payment types
export interface Transaction {
  id: string;
  txHash: string;
  type: TransactionType;
  taskId: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  chain: string;
  status: TransactionStatus;
  createdAt: Date;
  confirmedAt?: Date;
}

export type TransactionType = 
  | 'escrow_lock'
  | 'escrow_release'
  | 'escrow_refund'
  | 'direct_transfer'
  | 'stake'
  | 'unstake'
  | 'reward';

export type TransactionStatus = 
  | 'pending'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

// Auth types
export interface AuthenticatedAgent {
  did: string;
  address: string;
  publicKey: string;
  session: SessionInfo;
}

export interface SessionInfo {
  id: string;
  expiresAt: Date;
  capabilities: string[];
}

// Extended Request type
export interface AuthenticatedRequest extends Request {
  requestId: string;
  startTime: number;
  agent?: AuthenticatedAgent;
}

// WebSocket types
export interface WebSocketMessage {
  type: MessageType;
  payload: any;
  timestamp: number;
}

export type MessageType =
  | 'auth'
  | 'subscribe'
  | 'unsubscribe'
  | 'task_update'
  | 'execution_log'
  | 'bid_placed'
  | 'payment_received'
  | 'notification'
  | 'ping'
  | 'pong';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Event types
export interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  payload: any;
  timestamp: Date;
  version: number;
}

// Config types
export interface ServiceConfig {
  name: string;
  url: string;
  timeout: number;
  retries: number;
  healthCheck: {
    endpoint: string;
    interval: number;
  };
}

export interface BlockchainConfig {
  flow: {
    network: 'mainnet' | 'testnet';
    accessNode: string;
    contracts: {
      escrow: string;
      token: string;
    };
  };
  near: {
    network: 'mainnet' | 'testnet';
    rpcUrl: string;
    contracts: {
      escrow: string;
      token: string;
    };
  };
}

export interface StorageConfig {
  filecoin: {
    lotusUrl: string;
    token: string;
  };
  ipfs: {
    host: string;
    port: number;
    protocol: string;
  };
}
