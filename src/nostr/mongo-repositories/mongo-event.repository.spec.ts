import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from 'mongoose';
import {
  EXPIRED_EVENT,
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
  REPLACEABLE_EVENT,
  REPLACEABLE_EVENT_NEW,
} from '../../../seeds';
import { EventRepository } from '../repositories';
import { MongoRepositoriesModule } from './mongo-repositories.module';

describe('MongoEventRepository', () => {
  let eventRepository: EventRepository;
  let mongoServer: MongoMemoryServer;
  let connection: Connection;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    const moduleRef = await Test.createTestingModule({
      imports: [MongoRepositoriesModule],
    }).compile();

    connection = moduleRef.get(getConnectionToken());
    eventRepository = moduleRef.get(EventRepository);
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

  describe('find & findOne', () => {
    beforeEach(async () => {
      await Promise.all([
        eventRepository.create(REGULAR_EVENT),
        eventRepository.create(REPLACEABLE_EVENT),
        eventRepository.create(PARAMETERIZED_REPLACEABLE_EVENT),
        eventRepository.create(EXPIRED_EVENT),
      ]);
    });

    it('should filter by id successfully', async () => {
      expect(
        await eventRepository.find({
          ids: [REGULAR_EVENT.id, REPLACEABLE_EVENT.id],
        }),
      ).toEqual([REGULAR_EVENT, REPLACEABLE_EVENT]);

      expect(
        await eventRepository.find({ ids: [REGULAR_EVENT.id.slice(0, 10)] }),
      ).toEqual([REGULAR_EVENT]);

      expect(
        await eventRepository.findOne({ ids: [REGULAR_EVENT.id] }),
      ).toEqual(REGULAR_EVENT);

      expect(
        await eventRepository.findOne({ ids: [REGULAR_EVENT.id.slice(0, 10)] }),
      ).toEqual(REGULAR_EVENT);
    });

    it('should filter by kind successfully', async () => {
      expect(
        await eventRepository.find({
          kinds: [REGULAR_EVENT.kind, REPLACEABLE_EVENT.kind],
        }),
      ).toEqual([REGULAR_EVENT, REPLACEABLE_EVENT]);

      expect(
        await eventRepository.findOne({ kinds: [REGULAR_EVENT.kind] }),
      ).toEqual(REGULAR_EVENT);
    });

    it('should filter by authors successfully', async () => {
      expect(
        await eventRepository.find({ authors: [REGULAR_EVENT.pubkey] }),
      ).toEqual([REGULAR_EVENT, REPLACEABLE_EVENT]);

      expect(
        await eventRepository.find({
          authors: [REGULAR_EVENT.pubkey.slice(0, 10)],
        }),
      ).toEqual([REGULAR_EVENT, REPLACEABLE_EVENT]);

      expect(
        await eventRepository.findOne({ authors: [REGULAR_EVENT.pubkey] }),
      ).toEqual(REGULAR_EVENT);

      expect(
        await eventRepository.findOne({
          authors: [REGULAR_EVENT.pubkey.slice(0, 10)],
        }),
      ).toEqual(REGULAR_EVENT);
    });

    it('should filter by created_at successfully', async () => {
      expect(
        await eventRepository.find({ since: REPLACEABLE_EVENT.created_at }),
      ).toEqual([REGULAR_EVENT, REPLACEABLE_EVENT]);

      expect(
        await eventRepository.find({ until: REPLACEABLE_EVENT.created_at }),
      ).toEqual([REPLACEABLE_EVENT, PARAMETERIZED_REPLACEABLE_EVENT]);

      expect(
        await eventRepository.find({
          since: REPLACEABLE_EVENT.created_at,
          until: REPLACEABLE_EVENT.created_at,
        }),
      ).toEqual([REPLACEABLE_EVENT]);

      expect(
        await eventRepository.findOne({ until: REGULAR_EVENT.created_at }),
      ).toEqual(REGULAR_EVENT);

      expect(
        await eventRepository.findOne({ since: REPLACEABLE_EVENT.created_at }),
      ).toEqual(REGULAR_EVENT);
    });

    it('should filter by dTagValue successfully', async () => {
      expect(await eventRepository.find({ dTagValues: ['test'] })).toEqual([
        PARAMETERIZED_REPLACEABLE_EVENT,
      ]);

      expect(await eventRepository.findOne({ dTagValues: ['test'] })).toEqual(
        PARAMETERIZED_REPLACEABLE_EVENT,
      );
    });

    it('should filter by tag successfully', async () => {
      expect(
        await eventRepository.find({
          tags: {
            p: [
              '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
            ],
          },
        }),
      ).toEqual([PARAMETERIZED_REPLACEABLE_EVENT]);

      expect(
        await eventRepository.findOne({
          tags: {
            p: [
              '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
            ],
          },
        }),
      ).toEqual(PARAMETERIZED_REPLACEABLE_EVENT);
    });

    it('should find by multi filters successfully', async () => {
      expect(
        await eventRepository.find([
          { ids: [REGULAR_EVENT.id] },
          { kinds: [REPLACEABLE_EVENT.kind] },
        ]),
      ).toEqual([REGULAR_EVENT, REPLACEABLE_EVENT]);

      expect(
        await eventRepository.findOne([
          { ids: [REGULAR_EVENT.id] },
          { kinds: [REPLACEABLE_EVENT.kind] },
        ]),
      ).toEqual(REGULAR_EVENT);
    });

    it('should limit successfully', async () => {
      expect(
        await eventRepository.find([
          { ids: [REGULAR_EVENT.id], limit: 1 },
          { kinds: [REPLACEABLE_EVENT.kind], limit: 1 },
        ]),
      ).toHaveLength(1);

      expect(
        await eventRepository.find({
          authors: [REGULAR_EVENT.pubkey],
          limit: 1,
        }),
      ).toHaveLength(1);
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

  describe('count', () => {
    it('should count successfully', async () => {
      const EVENTS = [
        REGULAR_EVENT,
        REPLACEABLE_EVENT,
        PARAMETERIZED_REPLACEABLE_EVENT,
      ];
      await Promise.all(EVENTS.map((EVENT) => eventRepository.create(EVENT)));

      expect(await eventRepository.count([{}])).toBe(EVENTS.length);
    });
  });
});
