import { Injectable, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class StorageService implements OnApplicationShutdown {
  private readonly data: Map<string, [any, NodeJS.Timeout]> = new Map();

  async setNx<T = any>(key: string, value: T, ttl = 1000): Promise<boolean> {
    const exists = this.data.has(key);
    if (exists) return false;

    await this.set(key, value, ttl);
    return true;
  }

  async set<T = any>(key: string, value: T, ttl = 1000): Promise<void> {
    const [, oldTimeoutId] = this.data.get(key) ?? [];
    if (oldTimeoutId) clearTimeout(oldTimeoutId);

    const timeoutId = setTimeout(async () => {
      await this.del(key);
    }, ttl);
    this.data.set(key, [value, timeoutId]);
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const [value] = this.data.get(key) ?? [];
    return value;
  }

  async del(key: string): Promise<boolean> {
    const [, timeoutId] = this.data.get(key) ?? [];
    if (!timeoutId) return false;

    clearTimeout(timeoutId);
    this.data.delete(key);
    return true;
  }

  async onApplicationShutdown() {
    this.data.forEach(([, timeoutId], key) => {
      clearTimeout(timeoutId);
      this.data.delete(key);
    });
  }
}
