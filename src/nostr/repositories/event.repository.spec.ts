import { Test } from '@nestjs/testing';
import {
  getDataSourceToken,
  getRepositoryToken,
  TypeOrmModule,
} from '@nestjs/typeorm';
import 'dotenv/config';
import { sortBy } from 'lodash';
import { DataSource, Repository } from 'typeorm';
import {
  createEventDtoMock,
  EXPIRED_EVENT,
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
  REGULAR_EVENT_DTO,
  REPLACEABLE_EVENT,
  REPLACEABLE_EVENT_NEW,
} from '../../../seeds';
import { Event, Filter, GenericTag } from '../entities';
import { EventRepository } from '../repositories';

describe('EventRepository', () => {
  let rawEventRepository: Repository<Event>;
  let rawGenericTagRepository: Repository<GenericTag>;
  let eventRepository: EventRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: process.env.TEST_DATABASE_URL,
          autoLoadEntities: true,
          migrationsRun: true,
          migrations: ['dist/migrations/*.js'],
        }),
        TypeOrmModule.forFeature([Event, GenericTag]),
      ],
      providers: [EventRepository],
    }).compile();

    rawEventRepository = moduleRef.get(getRepositoryToken(Event));
    rawGenericTagRepository = moduleRef.get(getRepositoryToken(GenericTag));
    eventRepository = moduleRef.get(EventRepository);

    dataSource = moduleRef.get(getDataSourceToken());
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
    await rawGenericTagRepository.delete({});
    await rawEventRepository.delete({});
  });

  describe('create', () => {
    it('should create successfully', async () => {
      expect(await eventRepository.create(REGULAR_EVENT)).toBeTruthy();

      expect(
        (
          await eventRepository.findOne({ ids: [REGULAR_EVENT.id] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
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
          await eventRepository.findOne({ ids: [REGULAR_EVENT.id] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());

      expect(
        (
          await eventRepository.findOne({ ids: [REGULAR_EVENT.id] }, ['id'])
        )?.toEventDto().id,
      ).toEqual(REGULAR_EVENT.id);
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
          await eventRepository.findOne({ authors: [REGULAR_EVENT.pubkey] })
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
        (
          await eventRepository.find({
            authors: [PARAMETERIZED_REPLACEABLE_EVENT.author],
            kinds: [PARAMETERIZED_REPLACEABLE_EVENT.kind],
            dTagValues: ['test'],
          })
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [PARAMETERIZED_REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne({
            authors: [PARAMETERIZED_REPLACEABLE_EVENT.author],
            kinds: [PARAMETERIZED_REPLACEABLE_EVENT.kind],
            dTagValues: ['test'],
          })
        )?.toEventDto(),
      ).toEqual(PARAMETERIZED_REPLACEABLE_EVENT.toEventDto());
    });

    it('should filter by tag successfully', async () => {
      const manyTagsEvent = Event.fromEventDto(
        createEventDtoMock({
          tags: [
            ['a', 'test1'],
            ['b', 'test2'],
            ['c', 'test3'],
          ],
        }),
      );
      await eventRepository.create(manyTagsEvent);
      expect(
        (
          await eventRepository.find(
            Filter.fromFilterDto({
              tags: {
                a: ['test1'],
                b: ['test2'],
                c: ['test3'],
              },
              since: manyTagsEvent.createdAt - 1,
              until: manyTagsEvent.createdAt + 1,
              kinds: [manyTagsEvent.kind],
              authors: [manyTagsEvent.pubkey],
            }),
          )
        ).map((event) => event.toEventDto()),
      ).toEqual([manyTagsEvent].map((event) => event.toEventDto()));

      expect(
        (
          await eventRepository.find(
            Filter.fromFilterDto({
              tags: {
                p: [
                  '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
                ],
                d: ['test'],
              },
              kinds: [PARAMETERIZED_REPLACEABLE_EVENT.kind],
              authors: [PARAMETERIZED_REPLACEABLE_EVENT.pubkey],
            }),
          )
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [PARAMETERIZED_REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.find(
            Filter.fromFilterDto({
              tags: {
                p: [
                  '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
                ],
                d: ['fake'],
              },
            }),
          )
        ).map((event) => event.toEventDto()),
      ).toEqual([]);

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
            ['id'],
          )
        )?.toEventDto().id,
      ).toEqual(PARAMETERIZED_REPLACEABLE_EVENT.id);

      const unStandardTagEventDto = createEventDtoMock({
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

      expect(
        await eventRepository.findOne(
          Filter.fromFilterDto({ tags: { f: ['fake'] } }),
        ),
      ).toBeNull();
    });

    it('should limit successfully', async () => {
      expect(
        await eventRepository.find({
          authors: [REGULAR_EVENT.pubkey],
          limit: 1,
        }),
      ).toHaveLength(1);
    });

    it('should return empty', async () => {
      expect(await eventRepository.find({ limit: 0 })).toEqual([]);
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
    });
  });

  describe('findTopIdsWithScore', () => {
    it('should find top ids with score successfully', async () => {
      const EVENTS = [
        REGULAR_EVENT,
        REPLACEABLE_EVENT,
        PARAMETERIZED_REPLACEABLE_EVENT,
      ];
      await Promise.all(EVENTS.map((EVENT) => eventRepository.create(EVENT)));

      expect(await eventRepository.findTopIdsWithScore({})).toEqual(
        sortBy(
          EVENTS.map((e) => ({ id: e.id, score: e.createdAt })),
          (item) => -item.score,
        ),
      );

      expect(
        await eventRepository.findTopIdsWithScore(
          Filter.fromFilterDto({
            tags: {
              p: [
                '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
              ],
            },
          }),
        ),
      ).toEqual([
        {
          id: PARAMETERIZED_REPLACEABLE_EVENT.id,
          score: PARAMETERIZED_REPLACEABLE_EVENT.createdAt,
        },
      ]);
    });

    it('should return empty', async () => {
      expect(await eventRepository.findTopIdsWithScore({ limit: 0 })).toEqual(
        [],
      );
    });
  });
});
