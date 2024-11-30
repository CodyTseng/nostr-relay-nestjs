import { ConfigService } from '@nestjs/config';
import { INestApplicationContext } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import * as WebSocket from 'ws';
import { Config } from '@/config';
import { ConnectionManagerService } from '@/modules/connection-manager/connection-manager.service';
import { Request } from 'express';

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
}

export class CustomWebSocketAdapter extends WsAdapter {
  private wsServer: WebSocket.Server;
  private readonly appContext: INestApplicationContext;

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
      verifyClient: (info: { origin: string; secure: boolean; req: Request }) => {
        // Store the request object so it can be accessed in handleConnection
        (info.req as any).wsRequest = info.req;
        return true;
      },
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
