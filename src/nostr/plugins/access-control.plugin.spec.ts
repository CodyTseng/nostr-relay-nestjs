import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { ClientContext, Event, MessageType } from '@nostr-relay/common';
import { AccessControlPlugin } from './access-control.plugin';

describe('AccessControlPlugin', () => {
  let plugin: AccessControlPlugin;
  let ctx: ClientContext;
  let fakeSendMessage: jest.Mock;

  beforeEach(() => {
    plugin = new AccessControlPlugin(createMock<ConfigService>());
    fakeSendMessage = jest.fn();

    ctx = createMock<ClientContext>({
      sendMessage: fakeSendMessage,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    it('should block event if pubkey is in blacklist', async () => {
      (plugin as any)['blacklist'] = new Set(['blockedPubkey']);
      const fakeNext = jest.fn();
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
      const fakeNext = jest.fn();
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
      const fakeNext = jest.fn();
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
      const fakeNext = jest.fn();
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
