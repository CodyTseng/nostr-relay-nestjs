import { INestApplication } from '@nestjs/common';
import { MessageType } from '@nostr-relay/common';
import { WsAdapter } from 'another-nestjs-ws-adapter';
import { ConfigService } from '@nestjs/config';
import { Config } from '../../../config';
import { SecurityConfig } from '../../../config/security.config';
import { ConnectionManagerService } from '../services/connection-manager.service';
import { WebSocket } from 'ws';
import { getIpFromReq } from '../../../utils';
import { Request } from 'express';

export function createEnhancedWsAdapter(
  app: INestApplication,
  connectionManager: ConnectionManagerService,
  configService: ConfigService<Config, true>,
) {
  const adapter = new WsAdapter(app);
  const securityConfig = configService.get('security', { infer: true });

  // Enhance the handleUpgrade method to implement connection limits
  const originalHandleUpgrade = adapter.handleUpgrade.bind(adapter);
  adapter.handleUpgrade = (request: Request, socket: any, head: any) => {
    const ip = getIpFromReq(request);
    
    if (!connectionManager.canConnect(ip)) {
      socket.write('HTTP/1.1 429 Too Many Connections\r\n\r\n');
      socket.destroy();
      return;
    }

    originalHandleUpgrade(request, socket, head);
  };

  // Add connection tracking
  adapter.bindClientConnect = (client: WebSocket, request: Request) => {
    const ip = getIpFromReq(request);
    connectionManager.registerConnection(client, ip);

    client.on('close', () => {
      connectionManager.removeConnection(client, ip);
    });
  };

  // Enhanced message preprocessor with security checks
  adapter.setMessagePreprocessor((message: any) => {
    try {
      // 1. Size check
      const messageSize = Buffer.byteLength(JSON.stringify(message));
      if (messageSize > securityConfig.websocket.maxMessageSize) {
        throw new Error('Message size exceeds limit');
      }

      // 2. Basic structure validation
      if (!Array.isArray(message) || message.length < 1) {
        return null;
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
        return null;
      }

      // 4. Type-specific payload validation
      switch (type) {
        case MessageType.EVENT:
          validateEventPayload(message[1], securityConfig);
          break;
        case MessageType.REQ:
          validateReqPayload(message.slice(1), securityConfig);
          break;
        case MessageType.AUTH:
          // Mark client as authenticated on valid AUTH message
          connectionManager.markAuthenticated(client);
          break;
      }

      return {
        event: type === 'TOP' ? 'TOP' : 'DEFAULT',
        data: message,
      };
    } catch (error) {
      // Log error and return null to reject the message
      console.error('Message preprocessing error:', error);
      return null;
    }
  });

  return adapter;
}

function validateEventPayload(
  payload: any,
  config: SecurityConfig,
): void {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid event payload');
  }

  const payloadSize = Buffer.byteLength(JSON.stringify(payload));
  if (payloadSize > config.websocket.payloadLimits.maxEventSize) {
    throw new Error('Event size exceeds limit');
  }

  // Add more specific event validation as needed
}

function validateReqPayload(
  payload: any[],
  config: SecurityConfig,
): void {
  if (payload.length < 2) {
    throw new Error('Invalid request payload');
  }

  const [subscriptionId, ...filters] = payload;
  
  if (typeof subscriptionId !== 'string') {
    throw new Error('Invalid subscription ID');
  }

  if (filters.length > config.websocket.payloadLimits.maxSubscriptionFilters) {
    throw new Error('Too many subscription filters');
  }

  for (const filter of filters) {
    const filterSize = Buffer.byteLength(JSON.stringify(filter));
    if (filterSize > config.websocket.payloadLimits.maxFilterLength) {
      throw new Error('Filter size exceeds limit');
    }
  }
}
