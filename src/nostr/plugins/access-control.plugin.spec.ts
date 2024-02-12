import { ConfigService } from '@nestjs/config';
import { createMock } from '@golevelup/ts-jest';
import { AccessControlPlugin } from './access-control.plugin';
import { Event } from '@nostr-relay/common';
import { Config } from 'src/config';

describe('AccessControlPlugin', () => {
  const blockResult = {
    canContinue: false,
    result: {
      success: false,
      message: 'blocked: you are banned from posting here',
    },
  };
  let configService: ConfigService<Config, true>;

  beforeEach(() => {
    configService = createMock<ConfigService>();
  });

  describe('beforeEventHandle', () => {
    it('should block event if pubkey is in blacklist', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValue({ blacklist: ['blockedPubkey'] });
      const result = new AccessControlPlugin(configService).beforeEventHandle(
        {} as any,
        {
          pubkey: 'blockedPubkey',
        } as Event,
      );
      expect(result).toEqual(blockResult);
    });

    it('should allow event if pubkey is not in blacklist', async () => {
      jest.spyOn(configService, 'get').mockReturnValue({
        blacklist: ['blockedPubkey'],
      });
      const result = new AccessControlPlugin(configService).beforeEventHandle(
        {} as any,
        { pubkey: 'allowedPubkey' } as Event,
      );
      expect(result).toEqual({ canContinue: true });
    });

    it('should block event if pubkey is not in whitelist', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValue({ whitelist: ['allowedPubkey'] });
      const result = new AccessControlPlugin(configService).beforeEventHandle(
        {} as any,
        {
          pubkey: 'notAllowedPubkey',
        } as Event,
      );
      expect(result).toEqual(blockResult);
    });

    it('should allow event if there is in whitelist and not in blacklist', async () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValue({ whitelist: ['allowedPubkey'] });
      const result = new AccessControlPlugin(configService).beforeEventHandle(
        {} as any,
        {
          pubkey: 'allowedPubkey',
        } as Event,
      );
      expect(result).toEqual({ canContinue: true });
    });
  });
});
