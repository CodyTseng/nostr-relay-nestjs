import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { isArray } from 'lodash';
import { Observable, of, tap } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config';

@Injectable()
export class CacheEventHandlingResultInterceptor implements NestInterceptor {
  private readonly cacheEnabled: boolean;
  private readonly cacheTtl: number;

  constructor(
    private readonly storageService: StorageService,
    configService: ConfigService<Config, true>,
  ) {
    const cacheConfig = configService.get('cache', { infer: true });
    this.cacheEnabled = cacheConfig.eventHandlingResultCacheEnabled;
    this.cacheTtl = cacheConfig.eventHandlingResultCacheTtl;
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Promise<Observable<any>> {
    if (!this.cacheEnabled) return next.handle();

    try {
      const cacheKey = this.getEventHandlingResultCacheKey(context);
      if (!cacheKey) return next.handle();

      const lock = await this.storageService.setNx(
        cacheKey,
        undefined,
        this.cacheTtl,
      );
      if (!lock) {
        const value = await this.storageService.get(cacheKey);
        return of(value);
      }

      return next.handle().pipe(
        tap(async (response) => {
          await this.storageService.set(cacheKey, response, this.cacheTtl);
        }),
      );
    } catch {
      return next.handle();
    }
  }

  getEventHandlingResultCacheKey(context: ExecutionContext): string | null {
    if (context.getType() !== 'ws') return null;

    const data = context.switchToWs().getData<unknown>();
    if (!isArray(data)) return null;

    const [, event] = data;
    if (!event) return null;

    return `EventHandlingResult:${event.id}`;
  }
}
