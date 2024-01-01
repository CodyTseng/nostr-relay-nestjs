import { Test } from '@nestjs/testing';
import {
  getDataSourceToken,
  getRepositoryToken,
  TypeOrmModule,
} from '@nestjs/typeorm';
import { EventKind, getTimestampInSeconds } from '@nostr-relay/common';
import 'dotenv/config';
import { DataSource, Repository } from 'typeorm';
import { createEvent } from '../../../test-utils/event';
import { EventEntity, GenericTagEntity } from '../entities';
import { EventSearchRepository } from './event-search.repository';
import { EventRepository } from './event.repository';

describe('EventRepository', () => {
  let rawEventRepository: Repository<EventEntity>;
  let rawGenericTagRepository: Repository<GenericTagEntity>;
  let eventRepository: EventRepository;
  let dataSource: DataSource;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: process.env.TEST_DATABASE_URL,
          autoLoadEntities: true,
          migrationsRun: true,
          migrations: ['dist/migrations/*.js'],
        }),
        TypeOrmModule.forFeature([EventEntity, GenericTagEntity]),
      ],
      providers: [
        EventRepository,
        {
          provide: EventSearchRepository,
          useValue: {
            find: jest.fn(),
            findTopIds: jest.fn(),
            add: jest.fn(),
            deleteMany: jest.fn(),
          },
        },
      ],
    }).compile();

    rawEventRepository = moduleRef.get(getRepositoryToken(EventEntity));
    rawGenericTagRepository = moduleRef.get(
      getRepositoryToken(GenericTagEntity),
    );
    eventRepository = moduleRef.get(EventRepository);

    dataSource = moduleRef.get(getDataSourceToken());
  });

  afterEach(async () => {
    await rawGenericTagRepository.delete({});
    await rawEventRepository.delete({});
    await dataSource.destroy();
  });

  describe('upsert', () => {
    it('should insert a new event', async () => {
      const event = createEvent({
        tags: [
          ['a', 'test'],
          ['b', 'test'],
        ],
      });
      const result = await eventRepository.upsert(event);
      expect(result).toEqual({ isDuplicate: false });

      const eventEntity = await rawEventRepository.findOneBy({ id: event.id });
      expect(eventEntity?.toEvent()).toEqual(event);
      const genericTagEntities = await rawGenericTagRepository.findBy({
        eventId: event.id,
      });
      expect(genericTagEntities.map((e) => e.tag)).toEqual([
        'a:test',
        'b:test',
      ]);
    });

    it('should update an existing event', async () => {
      const eventA = createEvent({
        kind: EventKind.SET_METADATA,
        content: 'a',
      });
      await eventRepository.upsert(eventA);

      const eventB = createEvent({
        kind: EventKind.SET_METADATA,
        content: 'b',
        created_at: eventA.created_at + 1,
      });
      const result = await eventRepository.upsert(eventB);
      expect(result).toEqual({ isDuplicate: false });

      const eventAEntity = await rawEventRepository.findOneBy({
        id: eventA.id,
      });
      expect(eventAEntity).toBeNull();
      const eventBEntity = await rawEventRepository.findOneBy({
        id: eventB.id,
      });
      expect(eventBEntity?.toEvent()).toEqual(eventB);
    });

    it('should not insert an event with same id', async () => {
      const event = createEvent();
      await eventRepository.upsert(event);
      const result = await eventRepository.upsert(event);
      expect(result).toEqual({ isDuplicate: true });

      const eventEntity = await rawEventRepository.findOneBy({ id: event.id });
      expect(eventEntity?.toEvent()).toEqual(event);
    });

    it('should not insert an event with earlier createdAt', async () => {
      const eventA = createEvent({
        kind: EventKind.SET_METADATA,
        content: 'a',
      });
      await eventRepository.upsert(eventA);

      const eventB = createEvent({
        kind: EventKind.SET_METADATA,
        content: 'b',
        created_at: eventA.created_at - 1,
      });
      const result = await eventRepository.upsert(eventB);
      expect(result).toEqual({ isDuplicate: true });

      const eventAEntity = await rawEventRepository.findOneBy({
        id: eventA.id,
      });
      expect(eventAEntity?.toEvent()).toEqual(eventA);
      const eventBEntity = await rawEventRepository.findOneBy({
        id: eventB.id,
      });
      expect(eventBEntity).toBeNull();
    });

    it('should insert an event with same createdAt and smaller id', async () => {
      const now = getTimestampInSeconds();
      const [A, B, C] = [
        createEvent({
          kind: EventKind.SET_METADATA,
          content: Math.random().toString(),
          created_at: now,
        }),
        createEvent({
          kind: EventKind.SET_METADATA,
          content: Math.random().toString(),
          created_at: now,
        }),
        createEvent({
          kind: EventKind.SET_METADATA,
          content: Math.random().toString(),
          created_at: now,
        }),
      ].sort((a, b) => (a.id < b.id ? -1 : 1));

      await eventRepository.upsert(B);
      const upsertAResult = await eventRepository.upsert(A);
      expect(upsertAResult).toEqual({ isDuplicate: false });

      const upsertCResult = await eventRepository.upsert(C);
      expect(upsertCResult).toEqual({ isDuplicate: true });

      const eventAEntity = await rawEventRepository.findOneBy({
        id: A.id,
      });
      expect(eventAEntity?.toEvent()).toEqual(A);
    });

    it('should throw an error', async () => {
      jest
        .spyOn(eventRepository['dataSource'], 'transaction')
        .mockRejectedValue(new Error('test'));

      await expect(eventRepository.upsert(createEvent())).rejects.toThrow(
        'test',
      );
    });
  });

  describe('find', () => {
    const now = getTimestampInSeconds();
    const events = [
      createEvent({
        kind: EventKind.LONG_FORM_CONTENT,
        content: 'hello nostr',
        tags: [
          ['d', 'test'],
          ['t', 'test'],
          ['e', 'test'],
        ],
        created_at: now + 1000,
      }),
      createEvent({
        kind: EventKind.TEXT_NOTE,
        content: 'hello world',
        tags: [['t', 'test']],
        created_at: now,
      }),
      createEvent({
        kind: EventKind.SET_METADATA,
        content: JSON.stringify({ name: 'cody' }),
        created_at: now - 1000,
      }),
    ];
    const [LONG_FORM_CONTENT_EVENT, TEXT_NOTE_EVENT, SET_METADATA_EVENT] =
      events;

    beforeEach(async () => {
      await Promise.all(events.map((event) => eventRepository.upsert(event)));
    });

    it('should filter by kind', async () => {
      const result = await eventRepository.find({
        kinds: [EventKind.TEXT_NOTE],
      });
      expect(result).toEqual([TEXT_NOTE_EVENT]);
    });

    it('should filter by author', async () => {
      const result = await eventRepository.find({
        authors: [TEXT_NOTE_EVENT.pubkey],
      });
      expect(result).toEqual(events);

      const result2 = await eventRepository.find({
        authors: ['test'],
      });
      expect(result2).toEqual([]);
    });

    it('should filter by since', async () => {
      const result = await eventRepository.find({
        since: now,
      });
      expect(result).toEqual([LONG_FORM_CONTENT_EVENT, TEXT_NOTE_EVENT]);
    });

    it('should filter by until', async () => {
      const result = await eventRepository.find({
        until: now,
      });
      expect(result).toEqual([TEXT_NOTE_EVENT, SET_METADATA_EVENT]);
    });

    it('should filter by since and until', async () => {
      const result = await eventRepository.find({
        since: now + 1,
        until: now + 1000,
      });
      expect(result).toEqual([LONG_FORM_CONTENT_EVENT]);
    });

    it('should filter by ids', async () => {
      const result = await eventRepository.find({
        ids: [TEXT_NOTE_EVENT.id],
      });
      expect(result).toEqual([TEXT_NOTE_EVENT]);
    });

    it('should filter by dTagValue', async () => {
      const result = await eventRepository.find({
        '#d': ['test'],
      });
      expect(result).toEqual([LONG_FORM_CONTENT_EVENT]);
    });

    it('should filter by search', async () => {
      jest
        .spyOn(eventRepository['eventSearchRepository'], 'find')
        .mockResolvedValueOnce([LONG_FORM_CONTENT_EVENT]);

      const result = await eventRepository.find({
        search: 'nostr',
      });

      expect(result).toEqual([LONG_FORM_CONTENT_EVENT]);
    });

    it('should return empty array directly if limit is 0', async () => {
      const result = await eventRepository.find({
        limit: 0,
      });
      expect(result).toEqual([]);
    });

    describe('filter by generic tags', () => {
      it('should filter by tags', async () => {
        const result = await eventRepository.find({
          '#t': ['test'],
        });
        expect(result).toEqual([LONG_FORM_CONTENT_EVENT, TEXT_NOTE_EVENT]);
      });

      it('should filter by multiple tags', async () => {
        const result = await eventRepository.find({
          '#t': ['test'],
          '#e': ['test'],
        });
        expect(result).toEqual([LONG_FORM_CONTENT_EVENT]);
      });

      it('should filter by tags and since', async () => {
        const result = await eventRepository.find({
          '#t': ['test'],
          since: now + 1,
        });
        expect(result).toEqual([LONG_FORM_CONTENT_EVENT]);
      });

      it('should filter by tags and until', async () => {
        const result = await eventRepository.find({
          '#t': ['test'],
          until: now + 1,
        });
        expect(result).toEqual([TEXT_NOTE_EVENT]);
      });

      it('should filter by tags and since and until', async () => {
        const result = await eventRepository.find({
          '#t': ['test'],
          since: now + 1,
          until: now + 1000,
        });
        expect(result).toEqual([LONG_FORM_CONTENT_EVENT]);
      });

      it('should filter by tags and authors', async () => {
        const result = await eventRepository.find({
          '#t': ['test'],
          authors: [TEXT_NOTE_EVENT.pubkey],
        });
        expect(result).toEqual([LONG_FORM_CONTENT_EVENT, TEXT_NOTE_EVENT]);
      });

      it('should filter by tags and kinds', async () => {
        const result = await eventRepository.find({
          '#t': ['test'],
          kinds: [EventKind.TEXT_NOTE],
        });
        expect(result).toEqual([TEXT_NOTE_EVENT]);
      });

      it('should filter by tags and ids', async () => {
        const result = await eventRepository.find({
          '#t': ['test'],
          ids: [TEXT_NOTE_EVENT.id],
        });
        expect(result).toEqual([TEXT_NOTE_EVENT]);
      });
    });
  });

  describe('findTopIds', () => {
    const now = getTimestampInSeconds();
    const events = [
      createEvent({
        kind: EventKind.LONG_FORM_CONTENT,
        content: 'hello nostr',
        tags: [
          ['d', 'test'],
          ['t', 'test'],
          ['e', 'test'],
        ],
        created_at: now + 1000,
      }),
      createEvent({
        kind: EventKind.TEXT_NOTE,
        content: 'hello world',
        tags: [['t', 'test']],
        created_at: now,
      }),
      createEvent({
        kind: EventKind.SET_METADATA,
        content: JSON.stringify({ name: 'cody' }),
        created_at: now - 1000,
      }),
    ];
    const [LONG_FORM_CONTENT_EVENT, TEXT_NOTE_EVENT] = events;

    beforeEach(async () => {
      await Promise.all(events.map((event) => eventRepository.upsert(event)));
    });

    it('should find top ids', async () => {
      const result = await eventRepository.findTopIds({
        authors: [TEXT_NOTE_EVENT.pubkey],
      });
      expect(result).toEqual(
        events.map((event) => ({
          id: event.id,
          score: event.created_at,
        })),
      );
    });

    it('should find top ids and filter by tags', async () => {
      const result = await eventRepository.findTopIds({
        '#t': ['test'],
      });
      expect(result).toEqual(
        [LONG_FORM_CONTENT_EVENT, TEXT_NOTE_EVENT].map((event) => ({
          id: event.id,
          score: event.created_at,
        })),
      );
    });

    it('should find top ids and filter by search', async () => {
      const mockResult = [
        {
          id: LONG_FORM_CONTENT_EVENT.id,
          score: 1,
        },
      ];
      jest
        .spyOn(eventRepository['eventSearchRepository'], 'findTopIds')
        .mockResolvedValueOnce(mockResult);

      const result = await eventRepository.findTopIds({
        search: 'nostr',
      });

      expect(result).toEqual(mockResult);
    });

    it('should return empty array directly if limit is 0', async () => {
      const result = await eventRepository.findTopIds({
        limit: 0,
      });
      expect(result).toEqual([]);
    });
  });
});
