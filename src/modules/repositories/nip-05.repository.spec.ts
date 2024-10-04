import 'dotenv/config';

import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { KyselyDb } from './kysely-db';
import { Nip05Repository } from './nip-05.repository';

describe('EventRepository', () => {
  let kyselyDb: KyselyDb;
  let nip05Repository: Nip05Repository;

  beforeEach(async () => {
    kyselyDb = new KyselyDb(
      createMock<ConfigService>({
        get: jest.fn().mockReturnValue({
          url: process.env.TEST_DATABASE_URL,
          maxConnections: 20,
        }),
      }),
    );
    nip05Repository = new Nip05Repository(kyselyDb);
  });

  afterEach(async () => {
    const db = kyselyDb.getDb();
    await db.deleteFrom('nip05').execute();
    await db.destroy();
  });

  it('should register, get and delete NIP-05 identity', async () => {
    expect(await nip05Repository.getPubkeyByName('test')).toBeUndefined();

    await nip05Repository.register(
      'test',
      'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
    );
    expect(await nip05Repository.getPubkeyByName('test')).toBe(
      'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
    );
    expect(await nip05Repository.getByName('test')).toEqual({
      name: 'test',
      pubkey:
        'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
      create_date: expect.any(Date),
    });
    expect(await nip05Repository.list()).toEqual([
      {
        name: 'test',
        pubkey:
          'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
        create_date: expect.any(Date),
      },
    ]);
    expect(await nip05Repository.list(10, 'test')).toEqual([]);

    await nip05Repository.delete('test');
    expect(await nip05Repository.getPubkeyByName('test')).toBeUndefined();
  });
});
