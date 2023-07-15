import { createMock } from '@golevelup/ts-jest';
import { newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import {
  createEventDtoMock,
  EXPIRED_EVENT,
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
  REGULAR_EVENT_DTO,
  REPLACEABLE_EVENT,
  REPLACEABLE_EVENT_NEW,
} from '../../../seeds';
import { Event, Filter } from '../entities';
import { EventRepository } from '../repositories';
import { EventSearchRepository } from './event-search.repository';

describe('EventRepository', () => {
  let eventRepository: EventRepository;
  let eventSearchCache: Event[] = [];

  beforeEach(async () => {
    const db = newDb();
    db.public.registerFunction({
      implementation: () => 'test',
      name: 'current_database',
    });
    db.public.registerFunction({
      implementation: () => 'test',
      name: 'version',
    });
    const ds: DataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [Event],
    });
    await ds.initialize();
    await ds.synchronize();
    const repository = ds.getRepository(Event);
    eventSearchCache = [];
    eventRepository = new EventRepository(
      repository,
      createMock<EventSearchRepository>({
        async add(event: Event) {
          eventSearchCache.push(event);
        },
        async deleteMany(eventIds: string[]) {
          eventSearchCache = eventSearchCache.filter(
            (event) => !eventIds.includes(event.id),
          );
        },
      }),
    );
  });

  describe('create', () => {
    it('should create successfully', async () => {
      expect(await eventRepository.create(REGULAR_EVENT)).toBeTruthy();

      expect(
        (
          await eventRepository.findOne({ ids: [REGULAR_EVENT.id] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
      expect(eventSearchCache).toEqual([REGULAR_EVENT]);
    });

    it('should return false when the event already exists', async () => {
      expect(
        await eventRepository.create(PARAMETERIZED_REPLACEABLE_EVENT),
      ).toBeTruthy();
      expect(
        await eventRepository.create(PARAMETERIZED_REPLACEABLE_EVENT),
      ).toBeFalsy();
    });

    it('should throw error', async () => {
      await expect(
        eventRepository.create(
          Event.fromEventDto({ ...REGULAR_EVENT_DTO, id: undefined } as any),
        ),
      ).rejects.toThrowError();
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
        (
          await eventRepository.find({
            ids: [REGULAR_EVENT.id, REPLACEABLE_EVENT.id],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.find({ ids: [REGULAR_EVENT.id.slice(0, 10)] })
        ).map((event) => event.toEventDto()),
      ).toEqual([REGULAR_EVENT].map((event) => event.toEventDto()));

      expect(
        (
          await eventRepository.findOne({ ids: [REGULAR_EVENT.id] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());

      expect(
        (
          await eventRepository.findOne({
            ids: [REGULAR_EVENT.id.slice(0, 10)],
          })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should filter by kind successfully', async () => {
      expect(
        (
          await eventRepository.find({
            kinds: [REGULAR_EVENT.kind, REPLACEABLE_EVENT.kind],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne({ kinds: [REGULAR_EVENT.kind] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should filter by authors successfully', async () => {
      expect(
        (await eventRepository.find({ authors: [REGULAR_EVENT.pubkey] })).map(
          (event) => event.toEventDto(),
        ),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.find({
            authors: [REGULAR_EVENT.pubkey.slice(0, 10)],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne({ authors: [REGULAR_EVENT.pubkey] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());

      expect(
        (
          await eventRepository.findOne({
            authors: [REGULAR_EVENT.pubkey.slice(0, 10)],
          })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should filter by created_at successfully', async () => {
      expect(
        (
          await eventRepository.find({ since: REPLACEABLE_EVENT.createdAt })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.find({ until: REPLACEABLE_EVENT.createdAt })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REPLACEABLE_EVENT, PARAMETERIZED_REPLACEABLE_EVENT].map((event) =>
          event.toEventDto(),
        ),
      );

      expect(
        (
          await eventRepository.find({
            since: REPLACEABLE_EVENT.createdAt,
            until: REPLACEABLE_EVENT.createdAt,
          })
        ).map((event) => event.toEventDto()),
      ).toEqual([REPLACEABLE_EVENT].map((event) => event.toEventDto()));

      expect(
        (
          await eventRepository.findOne({ until: REGULAR_EVENT.createdAt })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());

      expect(
        (
          await eventRepository.findOne({ since: REPLACEABLE_EVENT.createdAt })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should filter by dTagValue successfully', async () => {
      expect(
        (await eventRepository.find({ dTagValues: ['test'] })).map((event) =>
          event.toEventDto(),
        ),
      ).toEqual(
        [PARAMETERIZED_REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (await eventRepository.findOne({ dTagValues: ['test'] }))?.toEventDto(),
      ).toEqual(PARAMETERIZED_REPLACEABLE_EVENT.toEventDto());
    });

    it('should filter by tag successfully', async () => {
      expect(
        (
          await eventRepository.find(
            Filter.fromFilterDto({
              tags: {
                p: [
                  '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
                ],
              },
            }),
          )
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [PARAMETERIZED_REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne(
            Filter.fromFilterDto({
              tags: {
                p: [
                  '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
                ],
              },
            }),
          )
        )?.toEventDto(),
      ).toEqual(PARAMETERIZED_REPLACEABLE_EVENT.toEventDto());

      const unStandardTagEventDto = await createEventDtoMock({
        tags: [['z', 'test2']],
      });
      await eventRepository.create(Event.fromEventDto(unStandardTagEventDto));
      expect(
        (
          await eventRepository.findOne(
            Filter.fromFilterDto({ tags: { z: ['test1', 'test2'] } }),
          )
        )?.toEventDto(),
      ).toEqual(unStandardTagEventDto);
    });

    it('should find by multi filters successfully', async () => {
      expect(
        (
          await eventRepository.find([
            { ids: [REGULAR_EVENT.id] },
            { kinds: [REPLACEABLE_EVENT.kind] },
          ])
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne([
            { ids: [REGULAR_EVENT.id] },
            { kinds: [REPLACEABLE_EVENT.kind] },
          ])
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should limit successfully', async () => {
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
        (
          await eventRepository.findOne({
            ids: [REPLACEABLE_EVENT.id],
          })
        )?.toEventDto(),
      ).toEqual(REPLACEABLE_EVENT.toEventDto());
      expect(eventSearchCache).toEqual([REPLACEABLE_EVENT]);

      expect(
        await eventRepository.replace(
          REPLACEABLE_EVENT_NEW,
          REPLACEABLE_EVENT.id,
        ),
      ).toBeTruthy();
      expect(
        (
          await eventRepository.findOne({
            ids: [REPLACEABLE_EVENT_NEW.id],
          })
        )?.toEventDto(),
      ).toEqual(REPLACEABLE_EVENT_NEW.toEventDto());
      expect(
        await eventRepository.findOne({ ids: [REPLACEABLE_EVENT.id] }),
      ).toBeNull();
      expect(eventSearchCache).toEqual([REPLACEABLE_EVENT_NEW]);
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
        (
          await eventRepository.find({
            ids: [REGULAR_EVENT.id, REPLACEABLE_EVENT.id],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );
      expect(eventSearchCache).toEqual([REGULAR_EVENT, REPLACEABLE_EVENT]);

      expect(
        await eventRepository.delete([REGULAR_EVENT.id, REPLACEABLE_EVENT.id]),
      ).toBe(2);
      expect(
        await eventRepository.find({
          ids: [REGULAR_EVENT.id, REPLACEABLE_EVENT.id],
        }),
      ).toEqual([]);
      expect(eventSearchCache).toEqual([]);
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
