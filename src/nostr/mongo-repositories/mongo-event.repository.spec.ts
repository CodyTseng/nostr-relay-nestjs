import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import {
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
  REPLACEABLE_EVENT,
  REPLACEABLE_EVENT_NEW,
} from '../../../seeds';
import { DbEvent, DbEventSchema } from './db-event.schema';
import { MongoEventRepository } from './mongo-event.repository';

describe('MongoEventRepository', () => {
  let eventRepository: MongoEventRepository;
  let mongoServer: MongoMemoryServer;
  let connection: Connection;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(mongoServer.getUri()),
        MongooseModule.forFeature([
          { name: DbEvent.name, schema: DbEventSchema },
        ]),
      ],
      providers: [MongoEventRepository],
    }).compile();

    connection = moduleRef.get(getConnectionToken());
    eventRepository = moduleRef.get(MongoEventRepository);
  });

  afterEach(async () => {
    await connection.close();
    await mongoServer.stop();
  });

  describe('create', () => {
    it('should create successfully', async () => {
      expect(await eventRepository.create(REGULAR_EVENT)).toBeTruthy();

      expect(
        await eventRepository.findOne({ ids: [REGULAR_EVENT.id] }),
      ).toEqual(REGULAR_EVENT);
    });

    it('should return false when the event already exists', async () => {
      expect(
        await eventRepository.create(PARAMETERIZED_REPLACEABLE_EVENT),
      ).toBeTruthy();
      expect(
        await eventRepository.create(PARAMETERIZED_REPLACEABLE_EVENT),
      ).toBeFalsy();
    });
  });

  describe('replace', () => {
    it('should replace successfully', async () => {
      expect(await eventRepository.replace(REPLACEABLE_EVENT)).toBeTruthy();
      expect(
        await eventRepository.findOne({
          ids: [REPLACEABLE_EVENT.id],
        }),
      ).toEqual(REPLACEABLE_EVENT);

      expect(
        await eventRepository.replace(
          REPLACEABLE_EVENT_NEW,
          REPLACEABLE_EVENT.id,
        ),
      ).toBeTruthy();
      expect(
        await eventRepository.findOne({
          ids: [REPLACEABLE_EVENT_NEW.id],
        }),
      ).toEqual(REPLACEABLE_EVENT_NEW);
      expect(
        await eventRepository.findOne({ ids: [REPLACEABLE_EVENT.id] }),
      ).toBeNull();
    });

    it('should return false when the id of the old and new events are the same', async () => {
      expect(
        await eventRepository.replace(REPLACEABLE_EVENT, REPLACEABLE_EVENT.id),
      ).toBeFalsy();
    });
  });

  describe('delete', () => {
    it('should delete successfully', async () => {
      await eventRepository.create(REGULAR_EVENT);
      await eventRepository.create(REPLACEABLE_EVENT);

      expect(
        await eventRepository.find({
          ids: [REGULAR_EVENT.id, REPLACEABLE_EVENT.id],
        }),
      ).toEqual([REGULAR_EVENT, REPLACEABLE_EVENT]);

      expect(
        await eventRepository.delete(REGULAR_EVENT.pubkey, [
          REGULAR_EVENT.id,
          REPLACEABLE_EVENT.id,
        ]),
      ).toBe(2);
      expect(
        await eventRepository.find({
          ids: [REGULAR_EVENT.id, REPLACEABLE_EVENT.id],
        }),
      ).toEqual([]);
    });
  });
});
