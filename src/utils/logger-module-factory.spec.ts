import { loggerModuleFactory } from './logger-module-factory';
import * as fs from 'fs';

describe('loggerModuleFactory', () => {
  it('should return logger module config', () => {
    jest
      .spyOn(fs, 'statSync')
      .mockReturnValue({ isDirectory: () => true } as any);
    const configService = {
      get: jest.fn(() => ({
        dir: 'testDir',
        level: 'testLevel',
      })),
    };
    const result = loggerModuleFactory(configService as any);
    expect(result).toEqual({
      pinoHttp: {
        level: 'testLevel',
        transport: {
          targets: [
            {
              target: 'pino/file',
              options: { destination: 'testDir/common.log' },
            },
            {
              target: 'pino/file',
              options: { destination: 1 },
            },
          ],
        },
      },
    });
  });

  it('should throw error if log directory is not a directory', () => {
    jest
      .spyOn(fs, 'statSync')
      .mockReturnValue({ isDirectory: () => false } as any);
    const configService = {
      get: jest.fn(() => ({
        dir: 'testDir',
        level: 'testLevel',
      })),
    };
    expect(() => loggerModuleFactory(configService as any)).toThrow(
      `Log directory 'testDir' is not a directory`,
    );
  });

  it('should create log directory if it does not exist', () => {
    const mockMkdirSync = jest.fn();
    jest.spyOn(fs, 'statSync').mockImplementation(() => {
      throw new Error();
    });
    jest.spyOn(fs, 'mkdirSync').mockImplementation(mockMkdirSync);
    const configService = {
      get: jest.fn(() => ({
        dir: 'testDir',
        level: 'testLevel',
      })),
    };
    loggerModuleFactory(configService as any);
    expect(mockMkdirSync).toHaveBeenCalledWith('testDir', {
      recursive: true,
    });
  });
});
