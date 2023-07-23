import { createMock } from '@golevelup/ts-jest';
import { PinoLogger } from 'nestjs-pino';
import { TypeOrmLogger } from './type-orm-logger';

describe('TypeOrmLogger', () => {
  let loggerContext: string | undefined;

  const infoMock = jest.fn();
  const warnMock = jest.fn();
  const errorMock = jest.fn();
  const loggerMock = createMock<PinoLogger>({
    setContext: jest.fn((context) => (loggerContext = context)),
    info: infoMock,
    warn: warnMock,
    error: errorMock,
  });

  beforeEach(() => {
    infoMock.mockReset();
    warnMock.mockReset();
    errorMock.mockReset();
  });

  describe('constructor', () => {
    it('should set context', () => {
      new TypeOrmLogger(loggerMock);
      expect(loggerContext).toBe(TypeOrmLogger.name);
    });
  });

  describe('logQuery', () => {
    it('should do nothing', () => {
      const logger = new TypeOrmLogger(loggerMock);
      logger.logQuery();
      expect(loggerMock.info).not.toHaveBeenCalled();
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe('logQueryError', () => {
    it('should log error', () => {
      const logger = new TypeOrmLogger(loggerMock);
      const error = new Error('test error');
      const query = 'test query';
      const parameters = ['test parameter'];
      logger.logQueryError(error, query, parameters);
      expect(loggerMock.error).toHaveBeenCalledWith(
        { query, parameters },
        error.message,
      );
    });

    it('should log error message', () => {
      const logger = new TypeOrmLogger(loggerMock);
      const error = 'test error';
      const query = 'test query';
      const parameters = ['test parameter'];
      logger.logQueryError(error, query, parameters);
      expect(loggerMock.error).toHaveBeenCalledWith(
        { query, parameters },
        error,
      );
    });
  });

  describe('logQuerySlow', () => {
    it('should log warning', () => {
      const logger = new TypeOrmLogger(loggerMock);
      const time = 100;
      const query = 'test query';
      const parameters = ['test parameter'];
      logger.logQuerySlow(time, query, parameters);
      expect(loggerMock.warn).toHaveBeenCalledWith(
        { query, parameters, executionTime: time },
        'slow query',
      );
    });
  });

  describe('logSchemaBuild', () => {
    it('should log info', () => {
      const logger = new TypeOrmLogger(loggerMock);
      const message = 'test message';
      logger.logSchemaBuild(message);
      expect(loggerMock.info).toHaveBeenCalledWith(
        '[schema build] %s',
        message,
      );
    });
  });

  describe('logMigration', () => {
    it('should log info', () => {
      const logger = new TypeOrmLogger(loggerMock);
      const message = 'test message';
      logger.logMigration(message);
      expect(loggerMock.info).toHaveBeenCalledWith('[migration] %s', message);
    });
  });

  describe('log', () => {
    it('should log warning', () => {
      const logger = new TypeOrmLogger(loggerMock);
      const message = 'test message';
      logger.log('warn', message);
      expect(loggerMock.warn).toHaveBeenCalledWith(message);
    });

    it('should log info', () => {
      const logger = new TypeOrmLogger(loggerMock);
      const message = 'test message';
      logger.log('info', message);
      expect(loggerMock.info).toHaveBeenCalledWith(message);
    });
  });
});
