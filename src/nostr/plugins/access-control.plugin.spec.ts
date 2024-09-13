import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Event } from '@nostr-relay/common';
import { AccessControlPlugin } from './access-control.plugin';

describe('AccessControlPlugin', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create blacklist and whitelist if config is provided', () => {
      const configService = createMock<ConfigService>({
        get: jest.fn().mockReturnValue({
          blacklist: ['blacklisted'],
          whitelist: ['whitelisted'],
        }),
      });

      const plugin = new AccessControlPlugin(configService);

      expect(plugin).toBeDefined();
      expect(plugin['blacklist']?.has('blacklisted')).toBe(true);
      expect(plugin['whitelist']?.has('whitelisted')).toBe(true);
    });
  });

  describe('beforeHandleEvent', () => {
    let plugin: AccessControlPlugin;

    beforeEach(() => {
      plugin = new AccessControlPlugin(createMock<ConfigService>());
    });

    it('should block event if pubkey is in blacklist', async () => {
      (plugin as any)['blacklist'] = new Set(['blockedPubkey']);
      const result = plugin.beforeHandleEvent({
        id: 'blockedId',
        pubkey: 'blockedPubkey',
      } as Event);

      expect(result.canHandle).toBe(false);
      expect(result.message).toBe('blocked: you are banned from posting here');
    });

    it('should allow event if pubkey is not in blacklist', async () => {
      (plugin as any)['blacklist'] = new Set(['blockedPubkey']);
      const result = plugin.beforeHandleEvent({
        id: 'allowedId',
        pubkey: 'allowedPubkey',
      } as Event);

      expect(result.canHandle).toBe(true);
    });

    it('should block event if pubkey is not in whitelist', async () => {
      (plugin as any)['whitelist'] = new Set(['allowedPubkey']);
      const result = plugin.beforeHandleEvent({
        id: 'notAllowedId',
        pubkey: 'notAllowedPubkey',
      } as Event);

      expect(result.canHandle).toBe(false);
      expect(result.message).toBe('blocked: you are banned from posting here');
    });

    it('should allow event if there is in whitelist and not in blacklist', async () => {
      (plugin as any)['whitelist'] = new Set(['allowedPubkey']);
      const result = plugin.beforeHandleEvent({
        id: 'allowedId',
        pubkey: 'allowedPubkey',
      } as Event);

      expect(result.canHandle).toBe(true);
    });
  });
});
