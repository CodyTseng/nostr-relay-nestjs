import { createMock } from '@golevelup/ts-jest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  createEventDtoMock,
  createSignedEventMock,
  DELETION_EVENT,
  EPHEMERAL_EVENT,
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
  REPLACEABLE_EVENT,
  REPLACEABLE_EVENT_DTO,
  TEST_PUBKEY,
} from '../../../seeds';
import { EventKind } from '../constants';
import { Event, Filter } from '../entities';
import { EventRepository } from '../repositories';
import { EventSearchRepository } from '../repositories/event-search.repository';
import { createCommandResultResponse } from '../utils';
import { EventService } from './event.service';
import { LockService } from './lock.service';

describe('EventService', () => {
  describe('handleEvent', () => {
    let eventEmitter: EventEmitter2, mockEmit: jest.Mock;
    let lockService: LockService;
    let eventService: EventService;

    beforeEach(() => {
      mockEmit = jest.fn();
      eventEmitter = createMock<EventEmitter2>({
        emit: mockEmit,
      });
      lockService = new LockService();
      const eventRepository = createMock<EventRepository>();
      const eventSearchRepository = createMock<EventSearchRepository>();
      eventService = new EventService(
        eventRepository,
        eventSearchRepository,
        eventEmitter,
        lockService,
      );
    });

    describe('handleRegularEvent', () => {
      it('should save the event successfully', async () => {
        const eventRepository = createMock<EventRepository>({
          create: async () => true,
        });
        (eventService as any).eventRepository = eventRepository;

        await expect(eventService.handleEvent(REGULAR_EVENT)).resolves.toEqual(
          createCommandResultResponse(REGULAR_EVENT.id, true),
        );
        expect(mockEmit).toBeCalled();
      });

      it('should return duplicate when the event already exists', async () => {
        const eventRepository = createMock<EventRepository>({
          create: async () => false,
        });
        (eventService as any).eventRepository = eventRepository;

        await expect(eventService.handleEvent(REGULAR_EVENT)).resolves.toEqual(
          createCommandResultResponse(
            REGULAR_EVENT.id,
            true,
            'duplicate: the event already exists',
          ),
        );
        expect(mockEmit).not.toBeCalled();
      });
    });

    describe('handleReplaceableEvent', () => {
      it('should replace the event successfully', async () => {
        const eventRepository = createMock<EventRepository>({
          findOne: async () => null,
          replace: async () => true,
        });
        (eventService as any).eventRepository = eventRepository;

        await expect(
          eventService.handleEvent(REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(REPLACEABLE_EVENT.id, true),
        );
        expect(mockEmit).toBeCalled();
      });

      it('should return duplicate when the event already exists', async () => {
        const eventRepository = createMock<EventRepository>({
          findOne: async () => REPLACEABLE_EVENT,
          replace: async () => false,
        });
        (eventService as any).eventRepository = eventRepository;

        await expect(
          eventService.handleEvent(REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(
            REPLACEABLE_EVENT.id,
            true,
            'duplicate: the event already exists',
          ),
        );
        expect(mockEmit).not.toBeCalled();
      });

      it('should return duplicate when the event older than a similar event that already exists', async () => {
        const eventRepository = createMock<EventRepository>({
          findOne: async () =>
            Event.fromEventDto({
              ...REPLACEABLE_EVENT_DTO,
              created_at: REPLACEABLE_EVENT.createdAt + 1,
            }),
          replace: async () => true,
        });
        (eventService as any).eventRepository = eventRepository;

        await expect(
          eventService.handleEvent(REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(
            REPLACEABLE_EVENT.id,
            true,
            'duplicate: the event already exists',
          ),
        );
        expect(mockEmit).not.toBeCalled();
      });

      it('should return rate-limited when acquiring the lock fails', async () => {
        (eventService as any).lockService = createMock<LockService>({
          acquireLock: async () => false,
        });

        await expect(
          eventService.handleEvent(REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(
            REPLACEABLE_EVENT.id,
            false,
            'rate-limited: slow down there chief',
          ),
        );
      });
    });

    describe('handleParameterizedReplaceableEvent', () => {
      it('should replace the event successfully', async () => {
        const eventRepository = createMock<EventRepository>({
          findOne: async () => null,
          replace: async () => true,
        });
        (eventService as any).eventRepository = eventRepository;

        await expect(
          eventService.handleEvent(PARAMETERIZED_REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(PARAMETERIZED_REPLACEABLE_EVENT.id, true),
        );
        expect(mockEmit).toBeCalled();
      });

      it('should return rate-limited when acquiring the lock fails', async () => {
        (eventService as any).lockService = createMock<LockService>({
          acquireLock: async () => false,
        });

        await expect(
          eventService.handleEvent(PARAMETERIZED_REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(
            PARAMETERIZED_REPLACEABLE_EVENT.id,
            false,
            'rate-limited: slow down there chief',
          ),
        );
      });
    });

    describe('handleEphemeralEvent', () => {
      it('should broadcast the event', async () => {
        await expect(
          eventService.handleEvent(EPHEMERAL_EVENT),
        ).resolves.toBeUndefined();
        expect(mockEmit).toBeCalled();
      });

      it('should discard signed event', async () => {
        await expect(
          eventService.handleEvent(await createSignedEventMock()),
        ).resolves.toBeUndefined();
        expect(mockEmit).not.toBeCalled();
      });
    });

    describe('handleDeletionEvent', () => {
      it('should delete specified events', async () => {
        const EVENT_IDS_TO_BE_DELETED = [
          '1c7c87a5e52e6c4e94a6c018920f31f256db83f8560b26a493f059caaf730f56',
          '9cca98e4f6814e4efacec09d04f32dadeaba2cda9c492e63372fa171ca31012d',
          '3af892aeb1dee9a711891d03d31f27ed11fb97fc965e5586022dfde254ada8ac',
        ];
        const mockDelete = jest.fn();
        const eventRepository = createMock<EventRepository>({
          find: async (filters) => {
            if (Array.isArray(filters)) {
              return filters
                .map((filter) => {
                  if (filter.ids?.length) {
                    return filter.ids.map((id) => ({ id } as Event));
                  }
                  return filter.dTagValues?.map((id) => ({ id } as Event));
                })
                .flat() as Event[];
            }
            return [];
          },
          create: async () => true,
          delete: mockDelete,
        });
        (eventService as any).eventRepository = eventRepository;

        const eventDto = createEventDtoMock({
          pubkey: TEST_PUBKEY,
          kind: EventKind.DELETION,
          tags: [
            [
              'e',
              '1c7c87a5e52e6c4e94a6c018920f31f256db83f8560b26a493f059caaf730f56',
            ],
            [
              'e',
              '9cca98e4f6814e4efacec09d04f32dadeaba2cda9c492e63372fa171ca31012d',
            ],
            [
              'a',
              `${EventKind.LONG_FORM_CONTENT}:${TEST_PUBKEY}:3af892aeb1dee9a711891d03d31f27ed11fb97fc965e5586022dfde254ada8ac`,
            ],
            ['a', `${EventKind.TEXT_NOTE}:${TEST_PUBKEY}:test`],
            ['a', `${EventKind.LONG_FORM_CONTENT}:test:test`],
            ['a', ''],
          ],
        });
        await eventService.handleEvent(Event.fromEventDto(eventDto));
        expect(mockEmit).toBeCalled();
        expect(mockDelete).toHaveBeenCalledWith(EVENT_IDS_TO_BE_DELETED);
      });
    });

    describe('findByFilters', () => {
      it('should return events', async () => {
        const events = [REGULAR_EVENT, REPLACEABLE_EVENT, DELETION_EVENT];
        const eventRepository = createMock<EventRepository>({
          find: async () => events,
        });
        const eventSearchRepository = createMock<EventSearchRepository>({
          find: async () => events,
        });
        (eventService as any).eventRepository = eventRepository;
        (eventService as any).eventSearchRepository = eventSearchRepository;

        await expect(
          eventService.findByFilters([{}].map(Filter.fromFilterDto)),
        ).resolves.toEqual(events);

        await expect(
          eventService.findByFilters(
            [{ search: 'test' }].map(Filter.fromFilterDto),
          ),
        ).resolves.toEqual(events);

        await expect(
          eventService.findByFilters(
            [{}, { search: 'test' }].map(Filter.fromFilterDto),
          ),
        ).resolves.toEqual(events);
      });
    });

    describe('countByFilters', () => {
      it('should return count', async () => {
        const COUNT = 10;
        const eventRepository = createMock<EventRepository>({
          count: async () => COUNT,
        });
        (eventService as any).eventRepository = eventRepository;

        expect(
          await eventService.countByFilters([{}].map(Filter.fromFilterDto)),
        ).toBe(COUNT);
      });
    });

    describe('findTopIdsWithScore', () => {
      it('should return top ids', async () => {
        const eventSearchRepository = createMock<EventSearchRepository>({
          findTopIdsWithScore: async () => [
            { id: REGULAR_EVENT.id, score: REGULAR_EVENT.createdAt },
          ],
        });
        const eventRepository = createMock<EventRepository>({
          findTopIdsWithScore: async () => [
            { id: REPLACEABLE_EVENT.id, score: REPLACEABLE_EVENT.createdAt },
          ],
        });
        (eventService as any).eventSearchRepository = eventSearchRepository;
        (eventService as any).eventRepository = eventRepository;

        expect(
          await eventService.findTopIds(
            [{}, { search: 'test' }].map(Filter.fromFilterDto),
          ),
        ).toEqual([REGULAR_EVENT.id, REPLACEABLE_EVENT.id]);
      });
    });
  });
});
