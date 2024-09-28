import { WhitelistGuardPlugin } from './whitelist-guard.plugin';

describe('WhitelistGuardPlugin', () => {
  let whitelistGuard: WhitelistGuardPlugin;

  beforeEach(() => {
    whitelistGuard = new WhitelistGuardPlugin(['whitelistedPubkey']);
  });

  it('should return canHandle true if pubkey is in whitelist', () => {
    const event = {
      pubkey: 'whitelistedPubkey',
    } as any;
    expect(whitelistGuard.beforeHandleEvent(event)).toEqual({
      canHandle: true,
    });
  });

  it('should return canHandle false if pubkey is not in whitelist', () => {
    const event = {
      pubkey: 'normalPubkey',
    } as any;
    expect(whitelistGuard.beforeHandleEvent(event)).toEqual({
      canHandle: false,
      message: 'blocked: you are banned from posting here',
    });
  });
});
