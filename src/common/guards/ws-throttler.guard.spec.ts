import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerStorageService } from '@nestjs/throttler';
import { WsThrottlerGuard } from './ws-throttler.guard';

describe('WsThrottlerGuard', () => {
  const context = createMock<ExecutionContext>({
    getClass: jest.fn().mockReturnValue({ name: 'Test' }),
    getHandler: jest.fn().mockReturnValue({ name: 'test' }),
    switchToWs: jest.fn().mockReturnValue({
      getClient: jest.fn().mockReturnValue({ id: 'test' }),
    }),
  });

  let storageService: ThrottlerStorageService;

  beforeEach(() => {
    storageService = new ThrottlerStorageService();
  });

  afterEach(() => {
    storageService.onApplicationShutdown();
  });

  it('should be fine', async () => {
    const guard = new WsThrottlerGuard(
      [{ limit: 2, ttl: 10 }],
      storageService,
      new Reflector(),
    );
    await guard.onModuleInit();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'rate-limited: slow down there chief',
    );

    await new Promise((resolve) => setTimeout(resolve, 10));
    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'rate-limited: slow down there chief',
    );
  });
});
