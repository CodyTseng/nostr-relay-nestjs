import { Injectable } from '@nestjs/common';
import { Event } from '../entities';

@Injectable()
export class LockService {
  private readonly locks: Map<string, number> = new Map();

  async acquireLock(key: string, ttl = 500): Promise<boolean> {
    return new Promise((resolve) => {
      const expirationTime = this.locks.get(key);
      if (expirationTime && expirationTime > Date.now()) {
        resolve(false);
      }

      this.locks.set(key, Date.now() + ttl);
      resolve(true);
    });
  }

  async releaseLock(key: string): Promise<void> {
    return new Promise((resolve) => {
      this.locks.delete(key);
      resolve();
    });
  }

  getHandleReplaceableEventKey(event: Event) {
    return `${event.pubkey}:${event.kind}`;
  }

  getHandleParameterizedReplaceableEventKey(event: Event) {
    return `${event.pubkey}:${event.kind}:${event.dTagValue}`;
  }
}
