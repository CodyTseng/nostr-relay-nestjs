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
import { Event, Filter } from '../entities';
import { EventRepository } from '../repositories';
import { observableToArray } from '../utils';

describe('EventRepository', () => {
  let rawEventRepository: Repository<Event>;
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
        TypeOrmModule.forFeature([Event]),
      ],
      providers: [EventRepository],
    }).compile();

    rawEventRepository = moduleRef.get(getRepositoryToken(Event));
    eventRepository = moduleRef.get(EventRepository);
    dataSource = moduleRef.get(getDataSourceToken());
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  afterEach(async () => {
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
          await observableToArray(
            eventRepository.find({
              ids: [REGULAR_EVENT.id, REPLACEABLE_EVENT.id],
            }),
          )
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await eventRepository.findOne({ ids: [REGULAR_EVENT.id] })
        )?.toEventDto(),
      ).toEqual(REGULAR_EVENT.toEventDto());
    });

    it('should filter by kind successfully', async () => {
      expect(
        (
          await observableToArray(
            eventRepository.find({
              kinds: [REGULAR_EVENT.kind, REPLACEABLE_EVENT.kind],
            }),
          )
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
        (
          await observableToArray(
            eventRepository.find({ authors: [REGULAR_EVENT.pubkey] }),
          )
        ).map((event) => event.toEventDto()),
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
          await observableToArray(
            eventRepository.find({ since: REPLACEABLE_EVENT.createdAt }),
          )
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REGULAR_EVENT, REPLACEABLE_EVENT].map((event) => event.toEventDto()),
      );

      expect(
        (
          await observableToArray(
            eventRepository.find({ until: REPLACEABLE_EVENT.createdAt }),
          )
        ).map((event) => event.toEventDto()),
      ).toEqual(
        [REPLACEABLE_EVENT, PARAMETERIZED_REPLACEABLE_EVENT].map((event) =>
          event.toEventDto(),
        ),
      );

      expect(
        (
          await observableToArray(
            eventRepository.find({
              since: REPLACEABLE_EVENT.createdAt,
              until: REPLACEABLE_EVENT.createdAt,
            }),
          )
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
          await observableToArray(
            eventRepository.find({ dTagValues: ['test'] }),
          )
        ).map((event) => event.toEventDto()),
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
          await observableToArray(
            eventRepository.find(
              Filter.fromFilterDto({
                tags: {
                  p: [
                    '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
                  ],
                },
              }),
            ),
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
    });

    it('should limit successfully', async () => {
      expect(
        await observableToArray(
          eventRepository.find({
            authors: [REGULAR_EVENT.pubkey],
            limit: 1,
          }),
        ),
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

    it('should return false when the id of the old and new events are the same', async () => {
      expect(
        await eventRepository.replace(REPLACEABLE_EVENT, REPLACEABLE_EVENT.id),
      ).toBeFalsy();
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
    });
  });
});
