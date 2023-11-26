import { config, validateEnvironment } from '.';

describe('config', () => {
  it('should load config successfully', () => {
    process.env.DOMAIN = 'localhost';
    process.env.DATABASE_URL = 'postgresql://xxx:xxx/xxx';
    expect(config()).toBeDefined();
  });

  it('should validate environment successfully', () => {
    expect(
      validateEnvironment({
        DOMAIN: 'localhost',
        DATABASE_URL: 'postgresql://xxx:xxx/xxx',
        PORT: '3000',
        LOG_DIR: 'logs',
        LOG_LEVEL: 'info',
        LOG_SLOW_EXECUTION_THRESHOLD: '100',
        CREATED_AT_UPPER_LIMIT: '60',
        CREATED_AT_LOWER_LIMIT: '60',
        MIN_POW_DIFFICULTY: '16',
        MAX_SUBSCRIPTIONS_PER_CLIENT: '100',
        THROTTLER_LIMIT: '100',
        THROTTLER_TTL: '1',
        EVENT_HANDLING_RESULT_CACHE_TTL: '300000',
        FILTER_RESULT_CACHE_TTL: '10000',
        MEILI_SEARCH_SYNC_EVENT_KINDS: '0,1,30023',
        EVENT_MESSAGE_HANDLING_ENABLED: 'false',
        REQ_MESSAGE_HANDLING_ENABLED: 'false',
        CLOSE_MESSAGE_HANDLING_ENABLED: 'false',
        TOP_MESSAGE_HANDLING_ENABLED: 'false',
        AUTH_MESSAGE_HANDLING_ENABLED: 'false',
      }),
    ).toEqual({
      DOMAIN: 'localhost',
      DATABASE_URL: 'postgresql://xxx:xxx/xxx',
      PORT: 3000,
      LOG_DIR: 'logs',
      LOG_LEVEL: 'info',
      LOG_SLOW_EXECUTION_THRESHOLD: 100,
      CREATED_AT_UPPER_LIMIT: 60,
      CREATED_AT_LOWER_LIMIT: 60,
      MIN_POW_DIFFICULTY: 16,
      MAX_SUBSCRIPTIONS_PER_CLIENT: 100,
      THROTTLER_LIMIT: 100,
      THROTTLER_TTL: 1,
      EVENT_HANDLING_RESULT_CACHE_TTL: 300000,
      FILTER_RESULT_CACHE_TTL: 10000,
      MEILI_SEARCH_SYNC_EVENT_KINDS: [0, 1, 30023],
      EVENT_MESSAGE_HANDLING_ENABLED: false,
      REQ_MESSAGE_HANDLING_ENABLED: false,
      CLOSE_MESSAGE_HANDLING_ENABLED: false,
      TOP_MESSAGE_HANDLING_ENABLED: false,
      AUTH_MESSAGE_HANDLING_ENABLED: false,
    });
  });
});
