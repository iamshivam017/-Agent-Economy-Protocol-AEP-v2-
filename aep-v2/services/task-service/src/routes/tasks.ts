/**
 * Task routes
 */

import { Router } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import { logger } from '../utils/logger';

const router = Router();

// Get MongoDB collection
const getCollection = () => {
  const client = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017/aep');
  const db = client.db();
  return { collection: db.collection('tasks'), client };
};

// List tasks
router.get('/', async (req, res) => {
  const { client, collection } = getCollection();
  
  try {
    const { 
      q, type, status, minBudget, maxBudget, creator, assignedTo,
      page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc'
    } = req.query;

    const filter: any = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (creator) filter.creator = creator;
    if (assignedTo) filter.assignedTo = assignedTo;
    
    if (minBudget || maxBudget) {
      filter['budget.amount'] = {};
      if (minBudget) filter['budget.amount'].$gte = minBudget;
      if (maxBudget) filter['budget.amount'].$lte = maxBudget;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const sort: any = { [sortBy as string]: sortOrder === 'asc' ? 1 : -1 };

    const [tasks, total] = await Promise.all([
      collection.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit as string))
        .toArray(),
      collection.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: tasks,
      meta: {
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
          hasNext: skip + tasks.length < total,
          hasPrev: parseInt(page as string) > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error listing tasks', { error });
    res.status(500).json({ success: false, error: { code: 'LIST_ERROR', message: 'Failed to list tasks' } });
  } finally {
    await client.close();
  }
});

// Get task by ID
router.get('/:taskId', async (req, res) => {
  const { client, collection } = getCollection();
  
  try {
    const { taskId } = req.params;
    
    const task = await collection.findOne({ taskId });
    
    if (!task) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    logger.error('Error getting task', { error });
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to get task' } });
  } finally {
    await client.close();
  }
});

// Create task
router.post('/', async (req, res) => {
  const { client, collection } = getCollection();
  
  try {
    const taskData = req.body;
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task = {
      taskId,
      ...taskData,
      status: 'open',
      bids: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(task);
    
    logger.info('Task created', { taskId, creator: taskData.creator });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    logger.error('Error creating task', { error });
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: 'Failed to create task' } });
  } finally {
    await client.close();
  }
});

// Update task
router.patch('/:taskId', async (req, res) => {
  const { client, collection } = getCollection();
  
  try {
    const { taskId } = req.params;
    const updates = req.body;
    
    delete updates.taskId;
    delete updates._id;
    
    const result = await collection.findOneAndUpdate(
      { taskId },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error updating task', { error });
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: 'Failed to update task' } });
  } finally {
    await client.close();
  }
});

// Cancel task
router.post('/:taskId/cancel', async (req, res) => {
  const { client, collection } = getCollection();
  
  try {
    const { taskId } = req.params;
    
    const result = await collection.findOneAndUpdate(
      { taskId, status: { $in: ['open', 'bidding'] } },
      { $set: { status: 'cancelled', updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Task cannot be cancelled' } });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error cancelling task', { error });
    res.status(500).json({ success: false, error: { code: 'CANCEL_ERROR', message: 'Failed to cancel task' } });
  } finally {
    await client.close();
  }
});

// Get bids
router.get('/:taskId/bids', async (req, res) => {
  const { client, collection } = getCollection();
  
  try {
    const { taskId } = req.params;
    
    const task = await collection.findOne({ taskId }, { projection: { bids: 1 } });
    
    if (!task) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    res.json({ success: true, data: task.bids || [] });
  } catch (error) {
    logger.error('Error getting bids', { error });
    res.status(500).json({ success: false, error: { code: 'FETCH_ERROR', message: 'Failed to get bids' } });
  } finally {
    await client.close();
  }
});

// Place bid
router.post('/:taskId/bids', async (req, res) => {
  const { client, collection } = getCollection();
  
  try {
    const { taskId } = req.params;
    const bidData = req.body;
    
    const bid = {
      bidId: `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...bidData,
      status: 'pending',
      timestamp: new Date(),
    };

    const result = await collection.findOneAndUpdate(
      { taskId, status: { $in: ['open', 'bidding'] } },
      { 
        $push: { bids: bid },
        $set: { status: 'bidding', updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Cannot place bid on this task' } });
    }

    logger.info('Bid placed', { taskId, bidId: bid.bidId });

    res.status(201).json({ success: true, data: bid });
  } catch (error) {
    logger.error('Error placing bid', { error });
    res.status(500).json({ success: false, error: { code: 'BID_ERROR', message: 'Failed to place bid' } });
  } finally {
    await client.close();
  }
});

// Accept bid
router.post('/:taskId/bids/:bidId/accept', async (req, res) => {
  const { client, collection } = getCollection();
  
  try {
    const { taskId, bidId } = req.params;
    
    const task = await collection.findOne({ taskId });
    
    if (!task) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Task not found' } });
    }

    const bid = task.bids?.find((b: any) => b.bidId === bidId);
    
    if (!bid) {
      return res.status(404).json({ success: false, error: { code: 'BID_NOT_FOUND', message: 'Bid not found' } });
    }

    // Update all bids
    const updatedBids = task.bids.map((b: any) => ({
      ...b,
      status: b.bidId === bidId ? 'accepted' : 'rejected'
    }));

    const result = await collection.findOneAndUpdate(
      { taskId },
      { 
        $set: { 
          bids: updatedBids,
          assignedTo: bid.agentId,
          status: 'assigned',
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    logger.info('Bid accepted', { taskId, bidId, assignedTo: bid.agentId });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error accepting bid', { error });
    res.status(500).json({ success: false, error: { code: 'ACCEPT_ERROR', message: 'Failed to accept bid' } });
  } finally {
    await client.close();
  }
});

// Submit result
router.post('/:taskId/submit', async (req, res) => {
  const { client, collection } = getCollection();
  
  try {
    const { taskId } = req.params;
    const { output, cid } = req.body;
    
    const result = await collection.findOneAndUpdate(
      { taskId, status: 'assigned' },
      { 
        $set: { 
          result: { output, cid, submittedAt: new Date() },
          status: 'reviewing',
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Cannot submit result' } });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error submitting result', { error });
    res.status(500).json({ success: false, error: { code: 'SUBMIT_ERROR', message: 'Failed to submit result' } });
  } finally {
    await client.close();
  }
});

// Approve result
router.post('/:taskId/approve', async (req, res) => {
  const { client, collection } = getCollection();
  
  try {
    const { taskId } = req.params;
    
    const result = await collection.findOneAndUpdate(
      { taskId, status: 'reviewing' },
      { 
        $set: { 
          'result.approved': true,
          'result.approvedAt': new Date(),
          status: 'completed',
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_STATE', message: 'Cannot approve result' } });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error approving result', { error });
    res.status(500).json({ success: false, error: { code: 'APPROVE_ERROR', message: 'Failed to approve result' } });
  } finally {
    await client.close();
  }
});

export { router as taskRouter };
