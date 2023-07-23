import { loggerModuleFactory } from './logger-module-factory';

describe('loggerModuleFactory', () => {
  it('should return logger module config', () => {
    const configService = {
      get: jest.fn(() => ({
        dir: 'testDir',
        level: 'testLevel',
      })),
    };
    const result = loggerModuleFactory(configService as any);
    expect(result).toEqual({
      pinoHttp: {
        transport: {
          targets: [
            {
              level: 'testLevel',
              target: 'pino/file',
              options: { destination: 'testDir/common.log' },
            },
            {
              level: 'testLevel',
              target: 'pino/file',
              options: { destination: 1 },
            },
          ],
        },
      },
    });
  });
});
