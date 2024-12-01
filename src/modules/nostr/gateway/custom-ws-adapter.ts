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
  _setupComplete?: Promise<void>;
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
      
      // Create a setup promise
      const setupPromise = new Promise<void>((resolve) => {
        // Store the request on the socket for potential future use
        ws._request = req;
        (ws as any).upgradeReq = req;
        
        // Extract IP from headers
        let ip = 'unknown';
        if (req.headers['x-real-ip']) {
          ip = Array.isArray(req.headers['x-real-ip'])
            ? req.headers['x-real-ip'][0]
            : req.headers['x-real-ip'];
        } else if (req.headers['x-forwarded-for']) {
          const forwarded = req.headers['x-forwarded-for'];
          ip = Array.isArray(forwarded)
            ? forwarded[0].split(',')[0].trim()
            : forwarded.split(',')[0].trim();
        } else if (req.socket?.remoteAddress) {
          ip = req.socket.remoteAddress;
        }
        
        // Store the IP directly on the websocket object
        ws._ip = ip;
        
        this.logger.debug('WebSocket connection setup complete', {
          headers: req.headers,
          remoteAddress: req.socket?.remoteAddress,
          extractedIp: ip,
          _ipSet: !!ws._ip
        });
        
        resolve();
      });

      // Store the setup promise on the websocket object
      ws._setupComplete = setupPromise;

      // Wait for setup to complete
      await setupPromise;
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
