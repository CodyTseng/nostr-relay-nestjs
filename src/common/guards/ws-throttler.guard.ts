import {
  ExecutionContext,
  Injectable,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { setInterval } from 'timers';
import { WebSocket } from 'ws';
import { ThrottlerException } from '../exceptions';

@Injectable()
export class WsThrottlerGuard
  extends ThrottlerGuard
  implements OnApplicationShutdown
{
  private blackList = new Map<string, number>();
  private interval: NodeJS.Timeout;

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
    this.interval = setInterval(
      () => {
        this.blackList.forEach((value, key) => {
          if (value < Date.now()) {
            this.blackList.delete(key);
          }
        });
      },
      60 * 60 * 1_000, // 1 hour
    );
  }

  onApplicationShutdown(): void {
    clearInterval(this.interval);
  }

  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions,
  ): Promise<boolean> {
    const client = context.switchToWs().getClient<WebSocket>();
    const blackListEndTime = this.blackList.get(client.ip);
    if (blackListEndTime) {
      if (blackListEndTime > Date.now()) {
        throw new ThrottlerException();
      }
      this.blackList.delete(client.ip);
    }

    const key = this.generateKey(context, client.id, throttler.name!);
    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      this.blackList.set(client.ip, Date.now() + 60 * 60 * 1_000); // 1 hour
      throw new ThrottlerException();
    }

    return true;
  }
}
