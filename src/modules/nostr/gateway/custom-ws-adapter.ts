import { ConfigService } from '@nestjs/config';
import { INestApplicationContext } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import * as WebSocket from 'ws';
import { Config } from '@/config';
import { ConnectionManagerService } from '@/modules/connection-manager/connection-manager.service';
import { IncomingMessage } from 'http';
import { Logger } from '@nestjs/common';

// Basic message types for NIP-42
interface AuthMessage {
  type: 'auth';
  data: {
    challenge: string;
  };
}

interface NostrMessage {
  type: 'nostr';
  data: any;
}

interface ConnectionState {
  ip: string;
  ipSet: boolean;
  setupComplete: boolean;
}

export interface EnhancedWebSocket extends WebSocket {
  id?: string;
  authenticated?: boolean;
  pubkey?: string;
  _request?: IncomingMessage;
  _connectionState: ConnectionState;
}

export class CustomWebSocketAdapter extends WsAdapter {
  private wsServer: WebSocket.Server;
  private readonly appContext: INestApplicationContext;
  protected readonly logger = new Logger(CustomWebSocketAdapter.name);

  constructor(
    app: INestApplicationContext,
    private readonly connectionManager: ConnectionManagerService,
    private readonly configService: ConfigService<Config, true>,
  ) {
    super(app);
    this.appContext = app;
  }

  create(port: number, options: any = {}): any {
    const server = (this.appContext as any).getHttpServer();
    
    this.wsServer = new WebSocket.Server({
      server,
      ...options,
    });

    // Handle connection event to attach request to socket
    this.wsServer.on('connection', async (ws: EnhancedWebSocket, req: IncomingMessage) => {
      this.logger.debug('WebSocket adapter starting connection setup');
      
      // Initialize connection state
      ws._connectionState = {
        ip: 'unknown',
        ipSet: false,
        setupComplete: false
      };

      // Store the request on the socket for potential future use
      ws._request = req;
      (ws as any).upgradeReq = req;
      
      // Extract IP from headers
      if (req.headers['x-real-ip']) {
        ws._connectionState.ip = Array.isArray(req.headers['x-real-ip'])
          ? req.headers['x-real-ip'][0]
          : req.headers['x-real-ip'];
      } else if (req.headers['x-forwarded-for']) {
        const forwarded = req.headers['x-forwarded-for'];
        ws._connectionState.ip = Array.isArray(forwarded)
          ? forwarded[0].split(',')[0].trim()
          : forwarded.split(',')[0].trim();
      } else if (req.socket?.remoteAddress) {
        ws._connectionState.ip = req.socket.remoteAddress;
      }
      
      // Mark as set and complete
      ws._connectionState.ipSet = true;
      ws._connectionState.setupComplete = true;
      
      this.logger.debug('WebSocket connection setup complete', {
        headers: req.headers,
        remoteAddress: req.socket?.remoteAddress,
        connectionState: ws._connectionState
      });
    });

    return server;
  }

  bindMessageHandlers(
    client: EnhancedWebSocket,
    handlers: any[],
    transform: any,
  ): void {
    const { messageHandlers } = transform;
    client.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        const messageHandler = messageHandlers.get(message[0]);
        if (messageHandler) {
          messageHandler.callback(client, message);
        }
      } catch (error) {
        console.error('Error handling message:', error);
      }
    });
  }
}
