import { INestApplication } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import * as WebSocket from 'ws';
import { ConfigService } from '@nestjs/config';
import { Config } from '@/config';
import { ConnectionManagerService } from '../services/connection-manager.service';
import { Request } from 'express';

// Basic message types for NIP-42
enum MessageType {
  EVENT = 'EVENT',
  REQ = 'REQ',
  CLOSE = 'CLOSE',
  AUTH = 'AUTH'
}

export interface EnhancedWebSocket extends WebSocket {
  id: string;
  authenticated: boolean;
  challenge?: string;
  connectedAt: Date;
}

export class CustomWebSocketAdapter extends WsAdapter {
  private wsServer: WebSocket.Server;

  constructor(
    private readonly app: INestApplication,
    private readonly connectionManager: ConnectionManagerService,
    private readonly configService: ConfigService<Config, true>,
  ) {
    super(app);
  }

  create(port: number, options: any = {}): WebSocket.Server {
    this.wsServer = new WebSocket.Server({
      ...options,
      noServer: true,
      handleProtocols: () => 'nostr',
    });

    const server = this.app.getHttpServer();
    server.on('upgrade', (request: Request, socket, head) => {
      console.log('Upgrade request received:', {
        protocol: request.headers['sec-websocket-protocol'],
        path: request.url
      });

      this.wsServer.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        const enhancedWs = ws as EnhancedWebSocket;
        enhancedWs.id = Math.random().toString(36).substring(2, 15);
        enhancedWs.authenticated = false; // Start as unauthenticated
        enhancedWs.connectedAt = new Date();
        console.log('Client connected:', enhancedWs.id);
        this.wsServer.emit('connection', enhancedWs, request);
      });
    });

    return this.wsServer;
  }

  bindClientConnect(server: WebSocket.Server, callback: Function) {
    server.on('connection', (client: WebSocket) => {
      const enhancedClient = client as EnhancedWebSocket;
      console.log('Client connected in bindClientConnect:', enhancedClient.id);
      callback(enhancedClient);
    });
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: { message: any; callback: (...args: any[]) => void }[],
    transform: (data: any) => any,
  ) {
    const enhancedClient = client as EnhancedWebSocket;
    enhancedClient.on('message', (data: WebSocket.Data) => {
      console.log('Received message from client', enhancedClient.id + ':', data.toString());
      
      let message: any;
      try {
        message = JSON.parse(data.toString());
      } catch (e) {
        console.error('Failed to parse message:', e);
        return;
      }

      // Handle NIP-42 AUTH message
      if (Array.isArray(message) && message[0] === MessageType.AUTH) {
        this.connectionManager.handleAuth(enhancedClient, message);
        return;
      }

      // For non-AUTH messages, check if authentication is required
      if (!enhancedClient.authenticated && this.connectionManager.requiresAuth(message)) {
        enhancedClient.send(JSON.stringify(["NOTICE", "Authentication required"]));
        return;
      }

      handlers.forEach(({ message: messageHandler, callback }) => {
        if (messageHandler.event === message[0]) {
          callback(message);
        }
      });
    });
  }

  async close(server: WebSocket.Server): Promise<void> {
    console.log('Closing WebSocket server');
    return new Promise((resolve) => {
      server.close(() => resolve());
    });
  }
}
