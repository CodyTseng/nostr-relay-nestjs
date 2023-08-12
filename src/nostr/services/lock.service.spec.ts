import {
  PARAMETERIZED_REPLACEABLE_EVENT,
  REPLACEABLE_EVENT,
} from '../../../seeds';
import { LockService } from './lock.service';

describe('LockService', () => {
  let lockService = new LockService();

  beforeEach(() => {
    lockService = new LockService();
  });

  afterEach(() => {
    lockService.onApplicationShutdown();
  });

  it('should be defined', () => {
    expect(lockService).toBeDefined();
  });

  it('should lock and unlock', async () => {
    const lock = await lockService.acquireLock('test');
    expect(lock).toBeTruthy();
    expect(await lockService.releaseLock('test')).toBeTruthy();
  });

  it('should not lock if locked', async () => {
    const lock = await lockService.acquireLock('test');
    expect(lock).toBeTruthy();
    const lock2 = await lockService.acquireLock('test');
    expect(lock2).toBeFalsy();
    expect(await lockService.releaseLock('test')).toBeTruthy();
    const lock3 = await lockService.acquireLock('test');
    expect(lock3).toBeTruthy();
  });

  it('should return key', () => {
    expect(lockService.getHandleReplaceableEventKey(REPLACEABLE_EVENT)).toBe(
      `${REPLACEABLE_EVENT.pubkey}:${REPLACEABLE_EVENT.kind}`,
    );
    expect(
      lockService.getHandleParameterizedReplaceableEventKey(
        PARAMETERIZED_REPLACEABLE_EVENT,
      ),
    ).toBe(
      `${PARAMETERIZED_REPLACEABLE_EVENT.pubkey}:${PARAMETERIZED_REPLACEABLE_EVENT.kind}:${PARAMETERIZED_REPLACEABLE_EVENT.dTagValue}`,
    );
  });

  it('should expire', async () => {
    const lock = await lockService.acquireLock('test', 1);
    expect(lock).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 2));
    const lock2 = await lockService.acquireLock('test');
    expect(lock2).toBeTruthy();
  });

  it('should return false if key does not exist', async () => {
    expect(await lockService.releaseLock('test')).toBeFalsy();
  });

  it('should clear all locks', async () => {
    const lock = await lockService.acquireLock('test');
    expect(lock).toBeTruthy();
    lockService.onApplicationShutdown();

    const lock2 = await lockService.acquireLock('test');
    expect(lock2).toBeTruthy();
  });
});
