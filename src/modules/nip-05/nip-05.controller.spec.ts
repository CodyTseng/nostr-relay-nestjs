import { createMock } from '@golevelup/ts-jest';
import { Nip05Controller } from './nip-05.controller';
import { ConfigService } from '@nestjs/config';
import { Nip05Repository } from '../repositories/nip-05.repository';
import { Nip05Entity } from './entities';

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

  describe('nip05', () => {
    it('should return empty JSON object when no name is provided', async () => {
      const result = await controller.nip05();
      expect(result).toEqual({});
    });

    it('should return admin pubkey when name is "_"', async () => {
      const result = await controller.nip05('_');
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
      const result = await controller.nip05('unknown');
      expect(result).toEqual({});
    });

    it('should return pubkey when name is known', async () => {
      jest
        .spyOn(controller['nip05Repository'], 'getPubkeyByName')
        .mockResolvedValue('pubkey');
      const result = await controller.nip05('known');
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

  describe('get', () => {
    it('should return the specified NIP-05 identity', async () => {
      const identity = {
        name: 'name',
        pubkey: 'pubkey',
        create_date: new Date(),
      };
      jest
        .spyOn(controller['nip05Repository'], 'getByName')
        .mockResolvedValue(identity);

      const result = await controller.get('name');
      expect(result).toEqual({ data: new Nip05Entity(identity) });
    });

    it('should throw a NotFoundException when the identity is not found', async () => {
      jest
        .spyOn(controller['nip05Repository'], 'getByName')
        .mockResolvedValue(undefined);

      await expect(controller.get('name')).rejects.toThrow(
        'NIP-05 identity not found',
      );
    });
  });

  describe('list', () => {
    it('should list NIP-05 identities', async () => {
      const identities = [
        {
          name: 'name1',
          pubkey: 'pubkey1',
          create_date: new Date(),
        },
        {
          name: 'name2',
          pubkey: 'pubkey2',
          create_date: new Date(),
        },
      ];
      jest
        .spyOn(controller['nip05Repository'], 'list')
        .mockResolvedValue(identities);

      const result = await controller.list({ limit: 10, after: 'name' });
      expect(result).toEqual({
        data: identities.map((row) => new Nip05Entity(row)),
      });
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
