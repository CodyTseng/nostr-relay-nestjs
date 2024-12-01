import { z } from 'zod';
import { config, validateEnvironment } from '.';
import { arraySchema } from './environment';

describe('config', () => {
  it('should load config successfully', () => {
    process.env.DOMAIN = 'localhost';
    process.env.DATABASE_URL = 'postgresql://xxx:xxx/xxx';
    expect(config()).toBeDefined();
  });

  it('should validate environment successfully', () => {
    expect(
      validateEnvironment({
        HOSTNAME: 'localhost',
        DOMAIN: 'localhost',
        DATABASE_URL: 'postgresql://xxx:xxx/xxx',
        DATABASE_MAX_CONNECTIONS: '20',
        PORT: '3000',
        LOG_DIR: 'logs',
        LOG_LEVEL: 'info',
        LOG_SLOW_EXECUTION_THRESHOLD: '100',
        CREATED_AT_UPPER_LIMIT: '60',
        CREATED_AT_LOWER_LIMIT: '60',
        MIN_POW_DIFFICULTY: '16',
        BLACKLIST:
          '8125b911ed0e94dbe3008a0be48cfe5cd0c0b05923cfff917ae7e87da8400883,82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
        WHITELIST:
          '8125b911ed0e94dbe3008a0be48cfe5cd0c0b05923cfff917ae7e87da8400883,82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
        MAX_SUBSCRIPTIONS_PER_CLIENT: '100',
        THROTTLER_LIMIT: '100',
        THROTTLER_TTL: '1',
        THROTTLER_EVENT_TTL: '1000',
        THROTTLER_EVENT_LIMIT: '10',
        THROTTLER_EVENT_BLOCK_DURATION: '600000',
        THROTTLER_REQ_TTL: '1000',
        THROTTLER_REQ_LIMIT: '100',
        THROTTLER_REQ_BLOCK_DURATION: '600000',
        EVENT_HANDLING_RESULT_CACHE_TTL: '300000',
        FILTER_RESULT_CACHE_TTL: '10000',
        MEILI_SEARCH_SYNC_EVENT_KINDS: '0,1,30023',
        EVENT_MESSAGE_HANDLING_ENABLED: 'false',
        REQ_MESSAGE_HANDLING_ENABLED: 'false',
        CLOSE_MESSAGE_HANDLING_ENABLED: 'false',
        TOP_MESSAGE_HANDLING_ENABLED: 'false',
        AUTH_MESSAGE_HANDLING_ENABLED: 'false',
        WOT_TRUST_ANCHOR_PUBKEY:
          '8125b911ed0e94dbe3008a0be48cfe5cd0c0b05923cfff917ae7e87da8400883',
        WOT_TRUST_DEPTH: '2',
        WOT_FETCH_FOLLOW_LIST_FROM: 'wss://relay.damus.io,wss://nos.lol',
        WOT_SKIP_FILTERS: '[{"kinds":[2333]}]',
        RELAY_NAME: 'Test Relay',
        RELAY_DESCRIPTION: 'Test relay for unit tests',
        RELAY_PUBKEY: '8125b911ed0e94dbe3008a0be48cfe5cd0c0b05923cfff917ae7e87da8400883',
        RELAY_CONTACT: 'test@example.com',
        RELAY_PROPAGATE_TO: 'wss://relay.damus.io,wss://nos.lol,wss://nostr.wine',
        UNDEFINED: undefined,
      }),
    ).toEqual({
      HOSTNAME: 'localhost',
      DOMAIN: 'localhost',
      DATABASE_URL: 'postgresql://xxx:xxx/xxx',
      DATABASE_MAX_CONNECTIONS: 20,
      PORT: 3000,
      NODE_ENV: 'development',
      LOG_DIR: 'logs',
      LOG_LEVEL: 'info',
      LOG_SLOW_EXECUTION_THRESHOLD: 100,
      CREATED_AT_UPPER_LIMIT: 60,
      CREATED_AT_LOWER_LIMIT: 60,
      MIN_POW_DIFFICULTY: 16,
      BLACKLIST: [
        '8125b911ed0e94dbe3008a0be48cfe5cd0c0b05923cfff917ae7e87da8400883',
        '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
      ],
      WHITELIST: [
        '8125b911ed0e94dbe3008a0be48cfe5cd0c0b05923cfff917ae7e87da8400883',
        '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
      ],
      MAX_SUBSCRIPTIONS_PER_CLIENT: 100,
      THROTTLER_LIMIT: 100,
      THROTTLER_TTL: 1,
      THROTTLER_EVENT_TTL: 1000,
      THROTTLER_EVENT_LIMIT: 10,
      THROTTLER_EVENT_BLOCK_DURATION: 600000,
      THROTTLER_REQ_TTL: 1000,
      THROTTLER_REQ_LIMIT: 100,
      THROTTLER_REQ_BLOCK_DURATION: 600000,
      EVENT_HANDLING_RESULT_CACHE_TTL: 300000,
      FILTER_RESULT_CACHE_TTL: 10000,
      MEILI_SEARCH_SYNC_EVENT_KINDS: [0, 1, 30023],
      EVENT_MESSAGE_HANDLING_ENABLED: false,
      REQ_MESSAGE_HANDLING_ENABLED: false,
      CLOSE_MESSAGE_HANDLING_ENABLED: false,
      TOP_MESSAGE_HANDLING_ENABLED: false,
      AUTH_MESSAGE_HANDLING_ENABLED: false,
      WOT_TRUST_ANCHOR_PUBKEY:
        '8125b911ed0e94dbe3008a0be48cfe5cd0c0b05923cfff917ae7e87da8400883',
      WOT_TRUST_DEPTH: 2,
      WOT_FETCH_FOLLOW_LIST_FROM: ['wss://relay.damus.io', 'wss://nos.lol'],
      WOT_SKIP_FILTERS: [{ kinds: [2333] }],
      RELAY_NAME: 'Test Relay',
      RELAY_DESCRIPTION: 'Test relay for unit tests',
      RELAY_PUBKEY: '8125b911ed0e94dbe3008a0be48cfe5cd0c0b05923cfff917ae7e87da8400883',
      RELAY_CONTACT: 'test@example.com',
      RELAY_PROPAGATE_TO: ['wss://relay.damus.io', 'wss://nos.lol', 'wss://nostr.wine'],
    });
  });

  it('array schema', () => {
    expect(arraySchema(z.number()).parse([1, 2, 3])).toEqual([1, 2, 3]);
    expect(arraySchema(z.number()).parse(1)).toEqual([1]);
  });
});
