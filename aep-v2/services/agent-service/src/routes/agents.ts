/**
 * Agent routes
 */

import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../index';
import { logger } from '../utils/logger';

const router = Router();

// Search agents
router.get('/', async (req, res) => {
  try {
    const { 
      q, 
      capability, 
      category,
      status, 
      minReputation = 0, 
      page = 1, 
      limit = 20,
      sortBy = 'reputationScore',
      sortOrder = 'desc'
    } = req.query;

    const where: Prisma.AgentWhereInput = {
      reputationScore: { gte: parseFloat(minReputation as string) },
    };

    if (status) {
      where.status = status as any;
    }

    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    if (capability || category) {
      where.capabilities = {
        some: {
          ...(capability && { name: capability as string }),
          ...(category && { category: category as string }),
        },
      };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        include: {
          capabilities: {
            select: {
              name: true,
              category: true,
              proficiency: true,
              verified: true,
            },
          },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { [sortBy as string]: sortOrder },
      }),
      prisma.agent.count({ where }),
    ]);

    res.json({
      success: true,
      data: agents,
      meta: {
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
          hasNext: skip + agents.length < total,
          hasPrev: parseInt(page as string) > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error searching agents', { error });
    res.status(500).json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: 'Failed to search agents' },
    });
  }
});

// Get agent by DID
router.get('/:did', async (req, res) => {
  try {
    const { did } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { did },
      include: {
        capabilities: true,
        _count: {
          select: {
            reputationHistory: true,
          },
        },
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' },
      });
    }

    res.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    logger.error('Error getting agent', { error, did: req.params.did });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to get agent' },
    });
  }
});

// Create agent
router.post('/', async (req, res) => {
  try {
    const { did, ownerAddress, name, description, avatar, capabilities, metadata } = req.body;

    // Check if agent already exists
    const existing = await prisma.agent.findUnique({
      where: { did },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_EXISTS', message: 'Agent with this DID already exists' },
      });
    }

    const agent = await prisma.agent.create({
      data: {
        did,
        ownerAddress,
        name,
        description,
        avatar,
        status: 'ACTIVE',
        ...(capabilities?.length > 0 && {
          capabilities: {
            create: capabilities,
          },
        }),
        ...(metadata && {
          version: metadata.version,
          runtime: metadata.runtime,
          metadataCid: metadata.cid,
        }),
      },
      include: {
        capabilities: true,
      },
    });

    logger.info('Agent created', { did, name });

    res.status(201).json({
      success: true,
      data: agent,
    });
  } catch (error) {
    logger.error('Error creating agent', { error });
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to create agent' },
    });
  }
});

// Update agent
router.patch('/:did', async (req, res) => {
  try {
    const { did } = req.params;
    const { name, description, avatar, status } = req.body;

    const agent = await prisma.agent.update({
      where: { did },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(avatar && { avatar }),
        ...(status && { status }),
      },
      include: {
        capabilities: true,
      },
    });

    logger.info('Agent updated', { did });

    res.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    logger.error('Error updating agent', { error, did: req.params.did });
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update agent' },
    });
  }
});

// Get agent stats
router.get('/:did/stats', async (req, res) => {
  try {
    const { did } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { did },
      select: {
        reputationScore: true,
        successRate: true,
        completionSpeed: true,
        peerRating: true,
        longevity: true,
        totalStake: true,
        totalEarned: true,
        tasksCompleted: true,
        tasksFailed: true,
        createdAt: true,
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' },
      });
    }

    // Calculate additional stats
    const totalTasks = agent.tasksCompleted + agent.tasksFailed;
    const actualSuccessRate = totalTasks > 0 ? (agent.tasksCompleted / totalTasks) * 100 : 0;

    res.json({
      success: true,
      data: {
        ...agent,
        actualSuccessRate,
        totalTasks,
        accountAge: Math.floor((Date.now() - agent.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      },
    });
  } catch (error) {
    logger.error('Error getting agent stats', { error, did: req.params.did });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to get agent stats' },
    });
  }
});

// Get agent tasks (placeholder - would call task service)
router.get('/:did/tasks', async (req, res) => {
  try {
    const { did } = req.params;
    const { status } = req.query;

    // This would typically call the task service
    // For now, return placeholder
    res.json({
      success: true,
      data: [],
      meta: {
        message: 'Task data available via task service',
      },
    });
  } catch (error) {
    logger.error('Error getting agent tasks', { error });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to get agent tasks' },
    });
  }
});

// Add capability
router.post('/:did/capabilities', async (req, res) => {
  try {
    const { did } = req.params;
    const { name, category, proficiency } = req.body;

    const agent = await prisma.agent.findUnique({
      where: { did },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' },
      });
    }

    const capability = await prisma.capability.create({
      data: {
        agentId: agent.id,
        name,
        category,
        proficiency: proficiency || 0.5,
      },
    });

    logger.info('Capability added', { did, name });

    res.status(201).json({
      success: true,
      data: capability,
    });
  } catch (error) {
    logger.error('Error adding capability', { error });
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to add capability' },
    });
  }
});

// Get agent capabilities
router.get('/:did/capabilities', async (req, res) => {
  try {
    const { did } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { did },
      include: {
        capabilities: true,
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Agent not found' },
      });
    }

    res.json({
      success: true,
      data: agent.capabilities,
    });
  } catch (error) {
    logger.error('Error getting capabilities', { error });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to get capabilities' },
    });
  }
});

// Get leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const { category = 'overall', limit = 10 } = req.query;

    let orderBy: any = { reputationScore: 'desc' };
    
    switch (category) {
      case 'successRate':
        orderBy = { successRate: 'desc' };
        break;
      case 'earnings':
        orderBy = { totalEarned: 'desc' };
        break;
      case 'completed':
        orderBy = { tasksCompleted: 'desc' };
        break;
    }

    const agents = await prisma.agent.findMany({
      where: { status: 'ACTIVE' },
      select: {
        did: true,
        name: true,
        avatar: true,
        reputationScore: true,
        successRate: true,
        totalEarned: true,
        tasksCompleted: true,
      },
      orderBy,
      take: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: agents.map((agent, index) => ({
        rank: index + 1,
        ...agent,
      })),
    });
  } catch (error) {
    logger.error('Error getting leaderboard', { error });
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to get leaderboard' },
    });
  }
});

export { router as agentRouter };
