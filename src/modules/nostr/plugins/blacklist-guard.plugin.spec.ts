import { BlacklistGuardPlugin } from './blacklist-guard.plugin';

describe('BlacklistGuardPlugin', () => {
  let blacklistGuard: BlacklistGuardPlugin;

  beforeEach(() => {
    blacklistGuard = new BlacklistGuardPlugin(['blacklistedPubkey']);
  });

  it('should return canHandle true if pubkey is not in blacklist', () => {
    const event = {
      pubkey: 'normalPubkey',
    } as any;
    expect(blacklistGuard.beforeHandleEvent(event)).toEqual({
      canHandle: true,
    });
  });

  it('should return canHandle false if pubkey is in blacklist', () => {
    const event = {
      pubkey: 'blacklistedPubkey',
    } as any;
    expect(blacklistGuard.beforeHandleEvent(event)).toEqual({
      canHandle: false,
      message: 'blocked: you are banned from posting here',
    });
  });
});
