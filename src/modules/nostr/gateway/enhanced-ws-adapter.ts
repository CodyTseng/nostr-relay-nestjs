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

export interface EnhancedWebSocket extends WebSocket {
  authenticated?: boolean;
}

export function createEnhancedWsAdapter(
  app: INestApplication,
  connectionManager: ConnectionManagerService,
  configService: ConfigService<Config, true>,
) {
  const adapter = new WsAdapter(app);
  const securityConfig = configService.get<SecurityConfig>('security');

  if (!securityConfig) {
    throw new Error('Security configuration is required');
  }

  // Enhance the handleUpgrade method to implement connection limits
  const originalHandleUpgrade = adapter.bindClientConnect.bind(adapter);
  adapter.bindClientConnect = (server: any, callback: Function) => {
    originalHandleUpgrade.call(adapter, server, (client: EnhancedWebSocket, req: Request) => {
      const ip = getIpFromReq(req);
      if (ip && connectionManager.canConnect(ip)) {
        connectionManager.registerConnection(client, ip);
        client.on('close', () => {
          if (ip) connectionManager.removeConnection(client, ip);
        });
        callback(client);
      } else {
        client.close(1008, 'Too many connections');
      }
    });
  };

  // Enhanced message preprocessor with security checks
  adapter.setMessagePreprocessor((message: any, client: EnhancedWebSocket) => {
    try {
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

      // 4. Type-specific payload validation
      switch (type) {
        case MessageType.EVENT:
          validateEventPayload(message[1], securityConfig);
          break;
        case MessageType.REQ:
          validateReqPayload(message.slice(1), securityConfig);
          break;
        case MessageType.AUTH:
          connectionManager.markAuthenticated(client);
          break;
      }

      return {
        event: type === 'TOP' ? 'TOP' : 'DEFAULT',
        data: message,
      };
    } catch (error) {
      console.error('Message preprocessing error:', error);
      return;
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
