import { createMock } from '@golevelup/ts-jest';
import { WotService } from './wot.service';
import { ConfigService } from '@nestjs/config';
import { NostrRelayLogger } from '../share/nostr-relay-logger.service';
import { EventRepository } from '../repositories/event.repository';

describe('WotService', () => {
  let wotService: WotService;

  beforeEach(() => {
    wotService = new WotService(
      createMock<ConfigService>(),
      createMock<NostrRelayLogger>(),
      createMock<EventRepository>(),
    );
  });

  it('getWotGuardPlugin', () => {
    expect(wotService.getWotGuardPlugin()).toBeDefined();
  });

  it('checkPubkeyIsTrusted (wot enabled)', () => {
    jest
      .spyOn(wotService['wotGuardPlugin'], 'getEnabled')
      .mockReturnValue(true);
    jest
      .spyOn(wotService['wotGuardPlugin'], 'checkPubkey')
      .mockReturnValue(true);

    expect(wotService.checkPubkeyIsTrusted('test')).toEqual(true);
  });

  it('checkPubkeyIsTrusted (wot disabled)', () => {
    jest
      .spyOn(wotService['wotGuardPlugin'], 'getEnabled')
      .mockReturnValue(false);

    expect(wotService.checkPubkeyIsTrusted('test')).toEqual(true);
  });

  it('refreshWot', async () => {
    jest
      .spyOn(wotService['wotGuardPlugin'], 'refreshTrustedPubkeySet')
      .mockResolvedValue(undefined);

    await wotService.refreshWot();

    expect(
      wotService['wotGuardPlugin'].refreshTrustedPubkeySet,
    ).toHaveBeenCalledTimes(1);
  });
});
