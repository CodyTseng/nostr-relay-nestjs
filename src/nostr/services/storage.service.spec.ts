import { StorageService } from './storage.service';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new StorageService();
  });

  afterEach(() => {
    storageService.onApplicationShutdown();
  });

  describe('setNx', () => {
    it('should set a value if the key does not exist', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 1000;

      const result = await storageService.setNx(key, value, ttl);

      expect(result).toBe(true);
      expect(await storageService.get(key)).toBe(value);
    });

    it('should not set a value if the key already exists', async () => {
      const key = 'test-key';
      const value1 = 'test-value-1';
      const value2 = 'test-value-2';
      const ttl = 1000;

      await storageService.set(key, value1, ttl);

      const result = await storageService.setNx(key, value2, ttl);

      expect(result).toBe(false);
      expect(await storageService.get(key)).toBe(value1);
    });
  });

  describe('set', () => {
    it('should set a value with a timeout', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 1000;

      await storageService.set(key, value, ttl);
      const result = await storageService.get(key);

      expect(result).toBe(value);
      expect(await storageService.get(key)).toBe(value);

      await new Promise((resolve) => setTimeout(resolve, ttl + 100));

      expect(await storageService.get(key)).toBeUndefined();
    });
  });

  describe('get', () => {
    it('should return the value for a given key', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 1000;

      await storageService.set(key, value, ttl);

      const result = await storageService.get(key);

      expect(result).toBe(value);
    });

    it('should return undefined for a non-existent key', async () => {
      const key = 'test-key';

      const result = await storageService.get(key);

      expect(result).toBeUndefined();
    });
  });

  describe('del', () => {
    it('should delete a value for a given key', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 1000;

      await storageService.set(key, value, ttl);

      const result = await storageService.del(key);

      expect(result).toBe(true);
      expect(await storageService.get(key)).toBeUndefined();
    });

    it('should return false for a non-existent key', async () => {
      const key = 'test-key';

      const result = await storageService.del(key);

      expect(result).toBe(false);
    });
  });
});
