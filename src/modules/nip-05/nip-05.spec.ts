import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { Nip05Module } from './nip-05.module';

describe('NIP-05', () => {
  const pubkey =
    'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7';
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [() => ({ 'relayInfo.pubkey': pubkey })],
          cache: true,
          isGlobal: true,
        }),
        Nip05Module,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return admin pubkey', () => {
    return request(app.getHttpServer())
      .get('/.well-known/nostr.json?name=_')
      .expect(200)
      .expect({
        names: {
          _: pubkey,
        },
      });
  });

  it('should return empty JSON object when no pubkey is configured', () => {
    return request(app.getHttpServer())
      .get('/.well-known/nostr.json?name=unknown')
      .expect(200)
      .expect({});
  });
});
