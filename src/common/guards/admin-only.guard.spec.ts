import { createMock } from '@golevelup/ts-jest';
import { AdminOnlyGuard } from './admin-only.guard';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext } from '@nestjs/common';

describe('AdminOnlyGuard', () => {
  let guard: AdminOnlyGuard;

  beforeEach(() => {
    guard = new AdminOnlyGuard(
      createMock<ConfigService>({
        get: jest.fn().mockReturnValue({ pubkey: 'admin-pubkey' }),
      }),
    );
  });

  it('should return false if adminPubkey is not set', () => {
    (guard as any).adminPubkey = undefined;
    const context = createMock<ExecutionContext>();
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should return false if pubkey is not equal to adminPubkey', () => {
    const context = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({ pubkey: 'not-admin-pubkey' }),
      }),
    });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should return true if pubkey is equal to adminPubkey', () => {
    const context = createMock<ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({ pubkey: 'admin-pubkey' }),
      }),
    });
    expect(guard.canActivate(context)).toBe(true);
  });
});
