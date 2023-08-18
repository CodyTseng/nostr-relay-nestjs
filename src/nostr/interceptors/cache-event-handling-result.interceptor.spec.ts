import { CacheEventHandlingResultInterceptor } from './cache-event-handling-result.interceptor';
import { ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { StorageService } from '../services/storage.service';

describe('CacheEventHandlingResult', () => {
  let interceptor: CacheEventHandlingResultInterceptor;
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
    interceptor = new CacheEventHandlingResultInterceptor(storageService);
  });

  afterEach(async () => {
    await storageService.onApplicationShutdown();
  });

  describe('intercept', () => {
    it('should return the response from the next handler if eventId is null', async () => {
      const context = {
        getType: () => 'http',
      } as ExecutionContext;
      const next = {
        handle: () => of('test-response'),
      };

      const result = await lastValueFrom(
        await interceptor.intercept(context, next as any),
      );

      expect(result).toBe('test-response');
    });

    it('should return the cached value if eventId is locked', async () => {
      const eventId = 'test-event-id';
      const context = {
        getType: () => 'ws',
        switchToWs: () => ({
          getData: () => [null, { id: eventId }],
        }),
      } as ExecutionContext;
      const next = {
        handle: () => of('test-response'),
      };
      await storageService.set(
        `EventHandlingResult:${eventId}`,
        'cached-value',
        60 * 1000,
      );

      const result = await lastValueFrom(
        await interceptor.intercept(context, next as any),
      );

      expect(result).toBe('cached-value');
    });

    it('should cache the response and return it if eventId is not locked', async () => {
      const eventId = 'test-event-id';
      const context = {
        getType: () => 'ws',
        switchToWs: () => ({
          getData: () => [null, { id: eventId }],
        }),
      } as ExecutionContext;
      const next = {
        handle: () => of('test-response'),
      };

      const result = await lastValueFrom(
        await interceptor.intercept(context, next as any),
      );

      expect(result).toBe('test-response');
      expect(await storageService.get(`EventHandlingResult:${eventId}`)).toBe(
        'test-response',
      );
    });

    it('should return the response from the next handler if an error occurs', async () => {
      const context = {
        getType: () => 'ws',
        switchToWs: () => ({
          getData: () => [null, { id: 'test-event-id' }],
        }),
      } as ExecutionContext;
      const next = {
        handle: () => of('test-response'),
      };
      jest.spyOn(storageService, 'setNx').mockRejectedValue('test-error');

      const result = await lastValueFrom(
        await interceptor.intercept(context, next as any),
      );

      expect(result).toBe('test-response');
    });

    it('should return the response from the next handler if the response is null', async () => {
      const eventId = 'test-event-id';
      const context = {
        getType: () => 'ws',
        switchToWs: () => ({
          getData: () => [null, { id: eventId }],
        }),
      } as ExecutionContext;
      const next = {
        handle: () => of(null),
      };

      const result = await lastValueFrom(
        await interceptor.intercept(context, next as any),
      );

      expect(result).toBeNull();
      expect(await storageService.get(`EventHandlingResult:${eventId}`)).toBe(
        null,
      );
    });
  });

  describe('getEventHandlingResultCacheKey', () => {
    it('should return null if context type is not ws', async () => {
      const context = {
        getType: () => 'http',
      } as ExecutionContext;

      const result = await interceptor['getEventHandlingResultCacheKey'](
        context,
      );

      expect(result).toBeNull();
    });

    it('should return null if data is not an array', async () => {
      const context = {
        getType: () => 'ws',
        switchToWs: () => ({
          getData: () => null,
        }),
      } as ExecutionContext;

      const result = await interceptor['getEventHandlingResultCacheKey'](
        context,
      );

      expect(result).toBeNull();
    });

    it('should return null if event is null', async () => {
      const context = {
        getType: () => 'ws',
        switchToWs: () => ({
          getData: () => [null, null],
        }),
      } as ExecutionContext;

      const result = await interceptor['getEventHandlingResultCacheKey'](
        context,
      );

      expect(result).toBeNull();
    });

    it('should return the event ID as a string', async () => {
      const eventId = 'test-event-id';
      const context = {
        getType: () => 'ws',
        switchToWs: () => ({
          getData: () => [null, { id: eventId }],
        }),
      } as ExecutionContext;

      const result = await interceptor['getEventHandlingResultCacheKey'](
        context,
      );

      expect(result).toBe(`EventHandlingResult:${eventId}`);
    });
  });
});
