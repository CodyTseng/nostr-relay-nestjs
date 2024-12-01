import { ConfigService } from '@nestjs/config';
import { INestApplicationContext, Logger } from '@nestjs/common';
import { WebSocketAdapter, WsMessageHandler } from '@nestjs/common';
import * as WebSocket from 'ws';
import { Config } from '@/config';
import { IncomingMessage } from 'http';
import { Observable } from 'rxjs';

export interface EnhancedWebSocket extends WebSocket {
  _request?: IncomingMessage;
  _clientId?: string;
}

export class CustomWebSocketAdapter implements WebSocketAdapter {
  protected readonly logger = new Logger(CustomWebSocketAdapter.name);
  private wsServer: WebSocket.Server;

  constructor(
    private readonly app: INestApplicationContext,
    private readonly configService: ConfigService<Config, true>,
  ) {}

  create(port: number, options: any = {}): any {
    const server = (this.app as any).getHttpServer();
    this.wsServer = new WebSocket.Server({
      server,
      ...options,
    });

    this.wsServer.on('connection', (ws: EnhancedWebSocket, req: IncomingMessage) => {
      this.logger.debug('WebSocket adapter starting connection setup');
      
      // Generate a unique ID for this connection
      const clientId = Math.random().toString(36).substring(7);
      ws._clientId = clientId;
      ws._request = req;

      this.logger.debug('WebSocket connection setup complete', {
        clientId,
        remoteAddress: req.socket?.remoteAddress
      });
    });

    return this.wsServer;
  }

  bindClientConnect(server: WebSocket.Server, callback: Function): void {
    server.on('connection', (client: WebSocket, req: IncomingMessage) => {
      callback(client, req);
    });
  }

  bindMessageHandlers(
    client: WebSocket,
    handlers: WsMessageHandler<any>[],
    transform: (data: any) => Observable<any>,
  ): void {
    client.on('message', (data: WebSocket.Data) => {
      let message;
      try {
        message = JSON.parse(data.toString());
        this.logger.debug(`Received message from client ${(client as EnhancedWebSocket)._clientId}:`, 
          Array.isArray(message) ? message[0] : 'unknown type');
      } catch (e) {
        message = data; // Raw message, pass as is
        this.logger.debug(`Received raw message from client ${(client as EnhancedWebSocket)._clientId}`);
      }

      try {
        // Transform the message and pass it to all handlers
        const transformed = transform(message);
        handlers.forEach(handler => {
          handler.callback(transformed);
        });
      } catch (error) {
        this.logger.error(`Error handling message from client ${(client as EnhancedWebSocket)._clientId}: ${error}`);
      }
    });

    // Handle connection close
    client.on('close', () => {
      this.logger.debug(`Client ${(client as EnhancedWebSocket)._clientId} disconnected`);
    });

    // Handle errors
    client.on('error', (err) => {
      this.logger.error(`WebSocket error for client ${(client as EnhancedWebSocket)._clientId}:`, err);
    });
  }

  close(server: WebSocket.Server): void {
    server.close();
  }
}
