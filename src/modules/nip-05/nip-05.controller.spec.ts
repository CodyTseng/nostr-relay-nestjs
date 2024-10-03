import { createMock } from '@golevelup/ts-jest';
import { Nip05Controller } from './nip-05.controller';
import { ConfigService } from '@nestjs/config';
import { Nip05Repository } from '../repositories/nip-05.repository';

describe('Nip05Controller', () => {
  let controller: Nip05Controller;

  beforeEach(() => {
    controller = new Nip05Controller(
      createMock<ConfigService>({
        get: jest.fn().mockReturnValue('admin-pubkey'),
      }),
      createMock<Nip05Repository>(),
    );
  });

  describe('get', () => {
    it('should return empty JSON object when no name is provided', async () => {
      const result = await controller.get();
      expect(result).toEqual({});
    });

    it('should return admin pubkey when name is "_"', async () => {
      const result = await controller.get('_');
      expect(result).toEqual({
        names: {
          _: 'admin-pubkey',
        },
      });
    });

    it('should return empty JSON object when name is unknown', async () => {
      jest
        .spyOn(controller['nip05Repository'], 'getPubkeyByName')
        .mockResolvedValue(undefined);
      const result = await controller.get('unknown');
      expect(result).toEqual({});
    });

    it('should return pubkey when name is known', async () => {
      jest
        .spyOn(controller['nip05Repository'], 'getPubkeyByName')
        .mockResolvedValue('pubkey');
      const result = await controller.get('known');
      expect(result).toEqual({
        names: {
          known: 'pubkey',
        },
      });
    });
  });

  describe('register', () => {
    it('should register a new NIP-05 identity', async () => {
      jest.spyOn(controller['nip05Repository'], 'register').mockResolvedValue();
      const result = await controller.register({
        name: 'name',
        pubkey: 'pubkey',
      });
      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete a NIP-05 identity by name', async () => {
      jest.spyOn(controller['nip05Repository'], 'delete').mockResolvedValue();
      const result = await controller.delete('name');
      expect(result).toBeUndefined();
    });
  });
});
