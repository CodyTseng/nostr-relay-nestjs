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
        LOG_SLOW_REQUEST_THRESHOLD: '100',
        EVENT_CREATED_AT_UPPER_LIMIT: '60',
        EVENT_CREATED_AT_LOWER_LIMIT: '60',
        EVENT_ID_MIN_LEADING_ZERO_BITS: '16',
        THROTTLER_LIMIT: '100',
        THROTTLER_TTL: '1',
        EVENT_HANDLING_RESULT_CACHE_ENABLED: 'false',
        EVENT_HANDLING_RESULT_CACHE_TTL: '300000',
        MEILI_SEARCH_SYNC_EVENT_KINDS: '0,1,30023',
      }),
    ).toEqual({
      DOMAIN: 'localhost',
      DATABASE_URL: 'postgresql://xxx:xxx/xxx',
      PORT: 3000,
      LOG_DIR: 'logs',
      LOG_LEVEL: 'info',
      LOG_SLOW_REQUEST_THRESHOLD: 100,
      EVENT_CREATED_AT_UPPER_LIMIT: 60,
      EVENT_CREATED_AT_LOWER_LIMIT: 60,
      EVENT_ID_MIN_LEADING_ZERO_BITS: 16,
      THROTTLER_LIMIT: 100,
      THROTTLER_TTL: 1,
      EVENT_HANDLING_RESULT_CACHE_ENABLED: false,
      EVENT_HANDLING_RESULT_CACHE_TTL: 300000,
      MEILI_SEARCH_SYNC_EVENT_KINDS: [0, 1, 30023],
    });
  });
});
