import { Injectable, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class StorageService implements OnApplicationShutdown {
  private readonly data = new Map<
    string,
    { data: any; timeoutId: NodeJS.Timeout }
  >();

  async setNx<T = any>(key: string, data: T, ttl = 1000): Promise<boolean> {
    const exists = this.data.has(key);
    if (exists) return false;

    await this.set(key, data, ttl);
    return true;
  }

  async set<T = any>(key: string, data: T, ttl = 1000): Promise<void> {
    const value = this.data.get(key);
    if (value) clearTimeout(value.timeoutId);

    const timeoutId = setTimeout(async () => {
      await this.del(key);
    }, ttl);
    this.data.set(key, { data, timeoutId });
  }

  async get<T = any>(key: string): Promise<T | undefined> {
    const value = this.data.get(key);
    return value ? value.data : undefined;
  }

  async del(key: string): Promise<boolean> {
    const value = this.data.get(key);
    if (!value) return false;

    clearTimeout(value.timeoutId);
    this.data.delete(key);
    return true;
  }

  async onApplicationShutdown() {
    this.data.forEach(({ timeoutId }, key) => {
      clearTimeout(timeoutId);
      this.data.delete(key);
    });
  }
}
