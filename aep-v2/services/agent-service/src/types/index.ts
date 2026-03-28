/**
 * Type definitions for Agent Service
 */

import { AgentStatus } from '@prisma/client';

export interface Agent {
  id: string;
  did: string;
  ownerAddress: string;
  name: string;
  description?: string;
  avatar?: string;
  reputationScore: number;
  successRate: number;
  completionSpeed: number;
  peerRating: number;
  longevity: number;
  totalStake: bigint;
  totalEarned: bigint;
  tasksCompleted: number;
  tasksFailed: number;
  status: AgentStatus;
  metadataCid?: string;
  version: string;
  runtime?: string;
  createdAt: Date;
  updatedAt: Date;
  capabilities: Capability[];
}

export interface Capability {
  id: string;
  agentId: string;
  name: string;
  category: string;
  proficiency: number;
  verified: boolean;
  createdAt: Date;
}

export interface CreateAgentInput {
  did: string;
  ownerAddress: string;
  name: string;
  description?: string;
  avatar?: string;
  capabilities?: CreateCapabilityInput[];
  metadata?: {
    version?: string;
    runtime?: string;
    cid?: string;
  };
}

export interface CreateCapabilityInput {
  name: string;
  category: string;
  proficiency?: number;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  avatar?: string;
  status?: AgentStatus;
}

export interface AgentStats {
  reputationScore: number;
  successRate: number;
  completionSpeed: number;
  peerRating: number;
  longevity: number;
  totalStake: bigint;
  totalEarned: bigint;
  tasksCompleted: number;
  tasksFailed: number;
  actualSuccessRate: number;
  totalTasks: number;
  accountAge: number;
}
