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
    });

    return server;
  }

  bindMessageHandlers(
    client: EnhancedWebSocket,
    handlers: any[],
    transform: (data: any) => any,
  ) {
    client.on('message', async (data, isBinary) => {
      if (isBinary) {
        return;
      }

      let message;
      try {
        message = JSON.parse(data.toString());
      } catch (e) {
        return;
      }

      // Handle authentication
      this.connectionManager.handleAuth(client, message);

      // Check if authentication is required for this message type
      if (!client.authenticated && this.connectionManager.requiresAuth(message)) {
        client.send(JSON.stringify(['NOTICE', 'Authentication required']));
        return;
      }

      for (const handler of handlers) {
        try {
          const response = await handler(message);
          if (response) {
            client.send(JSON.stringify(response));
          }
        } catch (err) {
          client.send(JSON.stringify(['NOTICE', 'Error processing message']));
        }
      }
    });
  }
}
