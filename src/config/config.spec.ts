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
        EVENT_CREATED_AT_UPPER_LIMIT: '60',
        EVENT_ID_MIN_LEADING_ZERO_BITS: '16',
      }),
    ).toEqual({
      DOMAIN: 'localhost',
      DATABASE_URL: 'postgresql://xxx:xxx/xxx',
      PORT: 3000,
      LOG_DIR: 'logs',
      LOG_LEVEL: 'info',
      EVENT_CREATED_AT_UPPER_LIMIT: 60,
      EVENT_ID_MIN_LEADING_ZERO_BITS: 16,
    });
  });
});
