import { PinoLogger } from 'nestjs-pino';
import { NostrRelayLogger } from './nostr-relay-logger.service';
import { createMock } from '@golevelup/ts-jest';
import { LogLevel } from '@nostr-relay/common';

describe('ConsoleLoggerService', () => {
  let logger: NostrRelayLogger;
  let pinoLogger: PinoLogger;

  beforeEach(() => {
    pinoLogger = createMock<PinoLogger>({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    });
    logger = new NostrRelayLogger(pinoLogger);
  });

  describe('setLogLevel', () => {
    it('should set the log level', () => {
      logger.setLogLevel(LogLevel.WARN);
      expect((logger as any).level).toEqual(LogLevel.WARN);
    });
  });

  describe('debug', () => {
    it('should log debug when log level is DEBUG', () => {
      logger.setLogLevel(LogLevel.DEBUG);
      logger.debug('debug message');
      expect(pinoLogger.debug).toHaveBeenCalledWith('debug message');
    });

    it('should not log debug when log level is higher than DEBUG', () => {
      logger.setLogLevel(LogLevel.INFO);
      logger.debug('debug message');
      expect(pinoLogger.debug).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info when log level is lower than INFO', () => {
      logger.setLogLevel(LogLevel.DEBUG);
      logger.info('info message');
      expect(pinoLogger.info).toHaveBeenCalledWith('info message');
    });

    it('should log info when log level is INFO', () => {
      logger.setLogLevel(LogLevel.INFO);
      logger.info('info message');
      expect(pinoLogger.info).toHaveBeenCalledWith('info message');
    });

    it('should not log info when log level is higher than INFO', () => {
      logger.setLogLevel(LogLevel.WARN);
      logger.info('info message');
      expect(pinoLogger.info).not.toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warn when log level is lower than WARN', () => {
      logger.setLogLevel(LogLevel.INFO);
      logger.warn('warn message');
      expect(pinoLogger.warn).toHaveBeenCalledWith('warn message');
    });

    it('should log warn when log level is WARN', () => {
      logger.setLogLevel(LogLevel.WARN);
      logger.warn('warn message');
      expect(pinoLogger.warn).toHaveBeenCalledWith('warn message');
    });

    it('should not log warn when log level is higher than WARN', () => {
      logger.setLogLevel(LogLevel.ERROR);
      logger.warn('warn message');
      expect(pinoLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error when log level is lower than ERROR', () => {
      logger.setLogLevel(LogLevel.WARN);
      logger.error('error message');
      expect(pinoLogger.error).toHaveBeenCalledWith('error message');
    });

    it('should log error when log level is ERROR', () => {
      logger.setLogLevel(LogLevel.ERROR);
      logger.error('error message');
      expect(pinoLogger.error).toHaveBeenCalledWith('error message');
    });

    it('should not log error when log level is higher than ERROR', () => {
      logger.setLogLevel(LogLevel.ERROR);
      logger.error('error message');
      expect(pinoLogger.error).toHaveBeenCalledWith('error message');
    });
  });
});
