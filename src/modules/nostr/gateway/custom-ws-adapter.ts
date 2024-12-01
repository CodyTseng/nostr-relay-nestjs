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

export interface EnhancedWebSocket extends WebSocket {
  id?: string;
  authenticated?: boolean;
  pubkey?: string;
  _request?: IncomingMessage;
  _ip?: string;
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
    
    // Create WebSocket server with custom client tracking
    this.wsServer = new WebSocket.Server({
      server,
      ...options,
      verifyClient: (info, cb) => {
        // Extract and store IP before connection is established
        let ip = 'unknown';
        if (info.req.headers['x-real-ip']) {
          ip = Array.isArray(info.req.headers['x-real-ip']) 
            ? info.req.headers['x-real-ip'][0] 
            : info.req.headers['x-real-ip'];
        } else if (info.req.headers['x-forwarded-for']) {
          const forwarded = info.req.headers['x-forwarded-for'];
          ip = Array.isArray(forwarded)
            ? forwarded[0].split(',')[0].trim()
            : forwarded.split(',')[0].trim();
        } else if (info.req.socket?.remoteAddress) {
          ip = info.req.socket.remoteAddress;
        }
        
        // Store IP on request object to access it in connection handler
        (info.req as any)._clientIp = ip;
        
        // Always accept the connection
        cb(true);
      }
    });

    // Handle connection event to attach request and IP to socket
    this.wsServer.on('connection', (ws: EnhancedWebSocket, req: IncomingMessage) => {
      // Store both the request and its headers directly on the socket
      ws._request = req;
      (ws as any).upgradeReq = req;
      
      // Get the IP we stored during verification
      ws._ip = (req as any)._clientIp || 'unknown';
      
      this.logger.debug('WebSocket connection established', {
        headers: req.headers,
        remoteAddress: req.socket?.remoteAddress,
        assignedIp: ws._ip
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
