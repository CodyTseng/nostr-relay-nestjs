import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { ClientContext, Event, MessageType } from '@nostr-relay/common';
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

  describe('handleMessage', () => {
    let plugin: AccessControlPlugin;
    let ctx: ClientContext;
    let fakeSendMessage: jest.Mock;
    let fakeNext: jest.Mock;

    beforeEach(() => {
      plugin = new AccessControlPlugin(createMock<ConfigService>());
      fakeSendMessage = jest.fn();
      fakeNext = jest.fn();

      ctx = createMock<ClientContext>({
        sendMessage: fakeSendMessage,
      });
    });

    it('should not block message if it is not an EVENT message', async () => {
      await plugin.handleMessage(ctx, [MessageType.REQ, 'reqId', {}], fakeNext);

      expect(fakeNext).toHaveBeenCalled();
      expect(fakeSendMessage).not.toHaveBeenCalled();
    });

    it('should block event if pubkey is in blacklist', async () => {
      (plugin as any)['blacklist'] = new Set(['blockedPubkey']);
      await plugin.handleMessage(
        ctx,
        [
          MessageType.EVENT,
          {
            id: 'blockedId',
            pubkey: 'blockedPubkey',
          } as Event,
        ],
        fakeNext,
      );

      expect(fakeNext).not.toHaveBeenCalled();
      expect(fakeSendMessage).toHaveBeenCalledWith([
        MessageType.OK,
        'blockedId',
        false,
        'blocked: you are banned from posting here',
      ]);
    });

    it('should allow event if pubkey is not in blacklist', async () => {
      (plugin as any)['blacklist'] = new Set(['blockedPubkey']);
      await plugin.handleMessage(
        ctx,
        [
          MessageType.EVENT,
          { id: 'allowedId', pubkey: 'allowedPubkey' } as Event,
        ],
        fakeNext,
      );

      expect(fakeNext).toHaveBeenCalled();
      expect(fakeSendMessage).not.toHaveBeenCalled();
    });

    it('should block event if pubkey is not in whitelist', async () => {
      (plugin as any)['whitelist'] = new Set(['allowedPubkey']);
      await plugin.handleMessage(
        ctx,
        [
          MessageType.EVENT,
          { id: 'notAllowedId', pubkey: 'notAllowedPubkey' } as Event,
        ],
        fakeNext,
      );

      expect(fakeNext).not.toHaveBeenCalled();
      expect(fakeSendMessage).toHaveBeenCalledWith([
        MessageType.OK,
        'notAllowedId',
        false,
        'blocked: you are banned from posting here',
      ]);
    });

    it('should allow event if there is in whitelist and not in blacklist', async () => {
      (plugin as any)['whitelist'] = new Set(['allowedPubkey']);
      await plugin.handleMessage(
        ctx,
        [
          MessageType.EVENT,
          { id: 'allowedId', pubkey: 'allowedPubkey' } as Event,
        ],
        fakeNext,
      );

      expect(fakeNext).toHaveBeenCalled();
      expect(fakeSendMessage).not.toHaveBeenCalled();
    });
  });
});
