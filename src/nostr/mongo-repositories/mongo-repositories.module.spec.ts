import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { EventRepository } from '../repositories';
import { MongoRepositoriesModule } from './mongo-repositories.module';

describe('MongoRepositoriesModule', () => {
  it('should be defined', async () => {
    const mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    const moduleRef = await Test.createTestingModule({
      imports: [MongoRepositoriesModule],
    }).compile();

    const connection = moduleRef.get(getConnectionToken());
    const eventRepository = moduleRef.get(EventRepository);

    expect(eventRepository).toBeDefined();

    await connection.close();
    await mongoServer.stop();
  });

  it('should throw missing MONGO_URL error', async () => {
    process.env.MONGO_URL = '';
    await expect(
      Test.createTestingModule({
        imports: [MongoRepositoriesModule],
      }).compile(),
    ).rejects.toThrow('missing MONGO_URL');
  });
});
