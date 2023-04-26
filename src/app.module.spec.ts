import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './app.module';
import { NostrWsAdapter } from './nostr/nostr-ws.adapter';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

describe('main', () => {
  let mongoServer: MongoMemoryServer;
  let app: INestApplication;
  let connection: Connection;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    process.env.DOMAIN = 'localhost';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new NostrWsAdapter(app));
    await app.init();

    connection = moduleRef.get(getConnectionToken());
  });

  afterEach(async () => {
    await app.close();
    await connection.close();
    await mongoServer.stop();
  });

  it('GET /', async () => {
    request(app.getHttpServer()).get('/').expect(200);
  });
});
