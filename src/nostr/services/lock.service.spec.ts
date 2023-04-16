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

  it('should be defined', () => {
    expect(lockService).toBeDefined();
  });

  it('should lock and unlock', async () => {
    const lock = await lockService.acquireLock('test');
    expect(lock).toBeTruthy();
    await lockService.releaseLock('test');
  });

  it('should not lock if locked', async () => {
    const lock = await lockService.acquireLock('test');
    expect(lock).toBeTruthy();
    const lock2 = await lockService.acquireLock('test');
    expect(lock2).toBeFalsy();
    await lockService.releaseLock('test');
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
});
