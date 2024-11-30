import { INestApplication, WebSocketAdapter } from '@nestjs/common';
import { MessageMappingProperties } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';
import * as WebSocket from 'ws';
import { ConnectionManagerService } from '@/modules/connection-manager/connection-manager.service';
import { SecurityConfig } from '@/config/security.config';
import { MessageType } from '../utils/message-type';

export interface EnhancedWebSocket extends WebSocket {
  id: string;
  authenticated: boolean;
  challenge?: string;
  connectedAt: Date;
}

function createWebSocketServer(
  connectionManager: ConnectionManagerService,
  securityConfig: SecurityConfig,
): WebSocketAdapter {
  const adapter: WebSocketAdapter = {
    create(port: number, options: any = {}): any {
      return new WebSocket.Server({ port, ...options });
    },

    bindClientConnect(server: any, callback: Function): void {
      server.on('connection', (socket: WebSocket) => {
        const enhancedSocket = Object.assign(socket, {
          id: randomUUID(),
          authenticated: false,
          connectedAt: new Date(),
        }) as EnhancedWebSocket;

        connectionManager.registerConnection(enhancedSocket);

        socket.on('close', () => {
          connectionManager.removeConnection(enhancedSocket);
        });

        socket.on('message', async (data: Buffer) => {
          try {
            const message = JSON.parse(data.toString());

            // Handle AUTH message for NIP-42
            if (message[0] === 'AUTH') {
              await connectionManager.handleAuth(enhancedSocket, message);
              return;
            }

            // Check if message requires authentication
            if (connectionManager.requiresAuth(message) && !enhancedSocket.authenticated) {
              socket.send(JSON.stringify(['NOTICE', 'Authentication required for this request']));
              return;
            }

            // 1. Size check
            const messageSize = Buffer.byteLength(JSON.stringify(message));
            if (messageSize > securityConfig.websocket.maxMessageSize) {
              return;
            }

            // 2. Basic structure validation
            if (!Array.isArray(message) || message.length < 1) {
              return;
            }

            // 3. Type checking
            const [type] = message;
            if (
              typeof type !== 'string' ||
              ![
                MessageType.EVENT,
                MessageType.REQ,
                MessageType.CLOSE,
                MessageType.AUTH,
                'TOP',
              ].includes(type)
            ) {
              return;
            }

            callback({
              event: type === 'TOP' ? 'TOP' : 'DEFAULT',
              data: message,
            });
          } catch (error) {
            console.error('Message preprocessing error:', error);
          }
        });
      });
    },

    bindMessageHandlers(
      client: WebSocket,
      handlers: MessageMappingProperties[],
      transform: (data: any) => Observable<any>,
    ): void {
      // This method is not needed for our implementation
    },

    close(server: any): void {
      server.close();
    },
  };

  return adapter;
}

export function createEnhancedWsAdapter(
  app: INestApplication,
  connectionManager: ConnectionManagerService,
  securityConfig: SecurityConfig,
): WebSocketAdapter {
  if (!securityConfig) {
    throw new Error('Security configuration is required');
  }

  return createWebSocketServer(connectionManager, securityConfig);
}
