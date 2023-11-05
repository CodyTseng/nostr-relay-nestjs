import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { delay, lastValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let logger: PinoLogger;

  beforeEach(async () => {
    logger = createMock<PinoLogger>({
      info: jest.fn(),
      warn: jest.fn(),
    });
    interceptor = new LoggingInterceptor(
      logger,
      createMock<ConfigService>({
        get: jest.fn().mockReturnValue({ slowExecutionThreshold: 10 }),
      }),
    );
  });

  it('should call next.handle() if context type is not "ws"', () => {
    const context = {
      getType: () => 'http',
    } as ExecutionContext;
    const next = {
      handle: () => of('test-response'),
    };
    const handleSpy = jest.spyOn(next, 'handle');

    interceptor.intercept(context, next as any);

    expect(handleSpy).toHaveBeenCalled();
  });

  it('should log info if execution time is less than 10ms', async () => {
    const context = {
      getType: () => 'ws',
      switchToWs: () => ({
        getData: () => 'test-data',
      }),
    } as ExecutionContext;
    const next = {
      handle: () => of('test-response'),
    };
    const infoSpy = jest.spyOn(logger, 'info');

    await lastValueFrom(interceptor.intercept(context, next as any));

    expect(infoSpy).toHaveBeenCalledWith(
      {
        data: 'test-data',
        executionTime: expect.any(Number),
      },
      expect.any(String),
    );
  });

  it('should log warn if execution time is greater than or equal to 10ms', async () => {
    const context = {
      getType: () => 'ws',
      switchToWs: () => ({
        getData: () => 'test-data',
      }),
    } as ExecutionContext;
    const next = {
      handle: () => of('test-response').pipe(delay(11)),
    };
    const warnSpy = jest.spyOn(logger, 'warn');

    await lastValueFrom(interceptor.intercept(context, next as any));

    expect(warnSpy).toHaveBeenCalledWith(
      {
        data: 'test-data',
        executionTime: expect.any(Number),
      },
      expect.any(String),
    );
  });
});
