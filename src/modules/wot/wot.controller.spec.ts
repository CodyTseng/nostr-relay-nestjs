import { createMock } from '@golevelup/ts-jest';
import { WotController } from './wot.controller';
import { WotService } from './wot.service';

describe('WotController', () => {
  let wotController: WotController;

  beforeEach(() => {
    wotController = new WotController(createMock<WotService>());
  });

  it('should throw error when pubkey is invalid', async () => {
    expect(() => wotController.trusted('test')).toThrow('Invalid pubkey');
    expect(() => wotController.trusted('npub1xxxxx')).toThrow('Invalid pubkey');
  });

  it('should return trusted when pubkey is valid', async () => {
    jest
      .spyOn(wotController['wotService'], 'checkPubkeyIsTrusted')
      .mockReturnValue(true);

    expect(
      wotController.trusted(
        'npub1syjmjy0dp62dhccq3g97fr87tngvpvzey08llyt6ul58m2zqpzps9wf6wl',
      ),
    ).toEqual({
      data: true,
    });
  });
});
