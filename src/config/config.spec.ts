import { config, validateEnvironment } from '.';

describe('config', () => {
  it('should load config successfully', () => {
    expect(config()).toBeDefined();
  });

  it('should validate environment successfully', () => {
    expect(
      validateEnvironment({
        PORT: '3000',
        LOG_DIR: 'logs',
        LOG_LEVEL: 'info',
      }),
    ).toEqual({
      PORT: 3000,
      LOG_DIR: 'logs',
      LOG_LEVEL: 'info',
    });
  });
});
