import { Environment } from './environment';

export interface SecurityConfig {
  websocket: {
    maxMessageSize: number;
    maxConnectionsPerIp: number;
    messageRateLimit: {
      ttl: number;
      limit: number;
    };
    authTimeout: number;
    payloadLimits: {
      maxEventSize: number;
      maxSubscriptionFilters: number;
      maxFilterLength: number;
    };
  };
}

export function securityConfig(env: Environment): SecurityConfig {
  return {
    websocket: {
      maxMessageSize: env.WS_MAX_MESSAGE_SIZE ?? 64 * 1024, // 64KB default
      maxConnectionsPerIp: env.WS_MAX_CONNECTIONS_PER_IP ?? 10,
      messageRateLimit: {
        ttl: env.WS_RATE_LIMIT_TTL ?? 60,
        limit: env.WS_RATE_LIMIT_COUNT ?? 30,
      },
      authTimeout: env.WS_AUTH_TIMEOUT ?? 30000, // 30 seconds
      payloadLimits: {
        maxEventSize: env.WS_MAX_EVENT_SIZE ?? 32 * 1024, // 32KB default
        maxSubscriptionFilters: env.WS_MAX_SUBSCRIPTION_FILTERS ?? 10,
        maxFilterLength: env.WS_MAX_FILTER_LENGTH ?? 1024,
      },
    },
  };
}
