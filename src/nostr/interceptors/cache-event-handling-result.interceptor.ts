import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { isArray } from 'lodash';
import { Observable, of, tap } from 'rxjs';
import { StorageService } from '../services/storage.service';

@Injectable()
export class CacheEventHandlingResultInterceptor implements NestInterceptor {
  constructor(private readonly storageService: StorageService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    try {
      const cacheKey = await this.getEventHandlingResultCacheKey(context);
      if (!cacheKey) return next.handle();

      const lock = await this.storageService.setNx(
        cacheKey,
        undefined,
        5 * 60 * 1000, // 5 minutes
      );
      if (!lock) {
        const value = await this.storageService.get(cacheKey);
        return of(value);
      }

      return next.handle().pipe(
        tap(async (response) => {
          // cache the response for 5 minutes
          await this.storageService.set(cacheKey, response, 5 * 60 * 1000);
        }),
      );
    } catch {
      return next.handle();
    }
  }

  private async getEventHandlingResultCacheKey(
    context: ExecutionContext,
  ): Promise<string | null> {
    if (context.getType() !== 'ws') return null;

    const data = context.switchToWs().getData<unknown>();
    if (!isArray(data)) return null;

    const [, event] = data;
    if (!event) return null;

    return `EventHandlingResult:${event.id}`;
  }
}
