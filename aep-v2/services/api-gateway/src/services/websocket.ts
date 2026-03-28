/**
 * WebSocket manager for real-time communication
 */

import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
import { WebSocketMessage, MessageType } from '../types';

interface ClientConnection {
  ws: WebSocket;
  did?: string;
  subscriptions: Set<string>;
  connectedAt: Date;
  lastPing: Date;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ClientConnection>;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.clients = new Map();
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: any) => {
      const clientId = crypto.randomUUID();
      
      logger.info('WebSocket client connected', { 
        clientId, 
        ip: req.socket.remoteAddress 
      });

      // Store client connection
      this.clients.set(clientId, {
        ws,
        subscriptions: new Set(),
        connectedAt: new Date(),
        lastPing: new Date(),
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'notification',
        payload: { message: 'Connected to AEP WebSocket' },
        timestamp: Date.now(),
      });

      // Handle messages
      ws.on('message', (data: Buffer) => {
        this.handleMessage(clientId, data);
      });

      // Handle close
      ws.on('close', (code: number, reason: Buffer) => {
        logger.info('WebSocket client disconnected', { 
          clientId, 
          code, 
          reason: reason.toString() 
        });
        this.clients.delete(clientId);
      });

      // Handle errors
      ws.on('error', (error: Error) => {
        logger.error('WebSocket error', { clientId, error: error.message });
      });

      // Send ping to keep connection alive
      ws.on('ping', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = new Date();
        }
      });
    });
  }

  private handleMessage(clientId: string, data: Buffer): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const client = this.clients.get(clientId);

      if (!client) {
        logger.warn('Message from unknown client', { clientId });
        return;
      }

      logger.debug('WebSocket message received', { 
        clientId, 
        type: message.type 
      });

      switch (message.type) {
        case 'auth':
          this.handleAuth(clientId, message.payload);
          break;

        case 'subscribe':
          this.handleSubscribe(clientId, message.payload);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(clientId, message.payload);
          break;

        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            payload: {},
            timestamp: Date.now(),
          });
          break;

        default:
          logger.warn('Unknown message type', { 
            clientId, 
            type: message.type 
          });
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message', { 
        clientId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      this.sendToClient(clientId, {
        type: 'notification',
        payload: { error: 'Invalid message format' },
        timestamp: Date.now(),
      });
    }
  }

  private handleAuth(clientId: string, payload: any): void {
    const { did, token } = payload;
    
    // TODO: Validate token
    const client = this.clients.get(clientId);
    if (client) {
      client.did = did;
      logger.info('WebSocket client authenticated', { clientId, did });
      
      this.sendToClient(clientId, {
        type: 'notification',
        payload: { message: 'Authenticated successfully' },
        timestamp: Date.now(),
      });
    }
  }

  private handleSubscribe(clientId: string, payload: any): void {
    const { channel } = payload;
    const client = this.clients.get(clientId);
    
    if (client) {
      client.subscriptions.add(channel);
      logger.info('Client subscribed to channel', { clientId, channel });
      
      this.sendToClient(clientId, {
        type: 'notification',
        payload: { message: `Subscribed to ${channel}` },
        timestamp: Date.now(),
      });
    }
  }

  private handleUnsubscribe(clientId: string, payload: any): void {
    const { channel } = payload;
    const client = this.clients.get(clientId);
    
    if (client) {
      client.subscriptions.delete(channel);
      logger.info('Client unsubscribed from channel', { clientId, channel });
      
      this.sendToClient(clientId, {
        type: 'notification',
        payload: { message: `Unsubscribed from ${channel}` },
        timestamp: Date.now(),
      });
    }
  }

  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  // Public methods for broadcasting

  public broadcast(message: WebSocketMessage): void {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  public broadcastToChannel(channel: string, message: WebSocketMessage): void {
    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(channel)) {
        this.sendToClient(clientId, message);
      }
    });
  }

  public broadcastToAgent(did: string, message: WebSocketMessage): void {
    this.clients.forEach((client, clientId) => {
      if (client.did === did) {
        this.sendToClient(clientId, message);
      }
    });
  }

  // Task-related broadcasts
  public notifyTaskUpdate(taskId: string, update: any): void {
    this.broadcastToChannel(`task:${taskId}`, {
      type: 'task_update',
      payload: { taskId, ...update },
      timestamp: Date.now(),
    });
  }

  public notifyBidPlaced(taskId: string, bid: any): void {
    this.broadcastToChannel(`task:${taskId}`, {
      type: 'bid_placed',
      payload: { taskId, bid },
      timestamp: Date.now(),
    });
  }

  public notifyExecutionLog(executionId: string, log: any): void {
    this.broadcastToChannel(`execution:${executionId}`, {
      type: 'execution_log',
      payload: { executionId, log },
      timestamp: Date.now(),
    });
  }

  public notifyPayment(agentId: string, payment: any): void {
    this.broadcastToAgent(agentId, {
      type: 'payment_received',
      payload: payment,
      timestamp: Date.now(),
    });
  }

  // Heartbeat to keep connections alive and remove stale clients
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const staleThreshold = 2 * 60 * 1000; // 2 minutes

      this.clients.forEach((client, clientId) => {
        // Check if client is stale
        if (now.getTime() - client.lastPing.getTime() > staleThreshold) {
          logger.info('Removing stale WebSocket client', { clientId });
          client.ws.terminate();
          this.clients.delete(clientId);
        } else {
          // Send ping
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.ping();
          }
        }
      });
    }, 30000); // Every 30 seconds
  }

  public closeAll(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client, clientId) => {
      client.ws.close(1000, 'Server shutting down');
    });
    
    this.clients.clear();
    this.wss.close();
  }

  public getStats(): { totalClients: number; authenticatedClients: number } {
    let authenticated = 0;
    this.clients.forEach(client => {
      if (client.did) authenticated++;
    });

    return {
      totalClients: this.clients.size,
      authenticatedClients: authenticated,
    };
  }
}

export default WebSocketManager;
