import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Event } from '../entities';

@Injectable()
export class LockService implements OnApplicationShutdown {
  private readonly locks: Map<string, NodeJS.Timeout> = new Map();

  async acquireLock(key: string, ttl = 1000): Promise<boolean> {
    const exists = this.locks.has(key);
    if (exists) {
      return false;
    }

    const timeoutId = setTimeout(async () => {
      await this.releaseLock(key);
    }, ttl);
    this.locks.set(key, timeoutId);
    return true;
  }

  async releaseLock(key: string): Promise<void> {
    const timeoutId = this.locks.get(key);
    if (!timeoutId) return;

    this.locks.delete(key);
    clearTimeout(timeoutId);
    return;
  }

  getHandleReplaceableEventKey(event: Event) {
    return `${event.pubkey}:${event.kind}`;
  }

  getHandleParameterizedReplaceableEventKey(event: Event) {
    return `${event.pubkey}:${event.kind}:${event.dTagValue}`;
  }

  onApplicationShutdown() {
    this.locks.forEach((timeoutId, key) => {
      clearTimeout(timeoutId);
      this.locks.delete(key);
    });
  }
}
