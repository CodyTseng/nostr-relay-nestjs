import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { EnhancedWebSocket } from '@/modules/nostr/gateway/enhanced-ws-adapter';
import { ThrottlerException } from '../exceptions';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
    throttler: ThrottlerOptions,
  ): Promise<boolean> {
    const client = context.switchToWs().getClient<EnhancedWebSocket>();
    const key = this.generateKey(context, client.id, throttler.name!);
    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      throw new ThrottlerException();
    }

    return true;
  }
}
