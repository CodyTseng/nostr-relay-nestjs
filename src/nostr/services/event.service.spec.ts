import { createMock } from '@golevelup/ts-jest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  createSignedEventMock,
  DELETION_EVENT,
  EPHEMERAL_EVENT,
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
  REPLACEABLE_EVENT,
  REPLACEABLE_EVENT_DTO,
} from '../../../seeds';
import { Event, Filter } from '../entities';
import { EventRepository, EventSearchRepository } from '../repositories';
import { createCommandResultResponse, observableToArray } from '../utils';
import { EventService } from './event.service';
import { StorageService } from './storage.service';

describe('EventService', () => {
  describe('handleEvent', () => {
    let eventEmitter: EventEmitter2, mockEmit: jest.Mock;
    let storageService: StorageService;
    let eventService: EventService;

    beforeEach(() => {
      mockEmit = jest.fn();
      eventEmitter = createMock<EventEmitter2>({
        emit: mockEmit,
      });
      storageService = new StorageService();
      const eventRepository = createMock<EventRepository>();
      const eventSearchRepository = createMock<EventSearchRepository>();
      eventService = new EventService(
        eventRepository,
        eventSearchRepository,
        eventEmitter,
        storageService,
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
        (eventService as any).storageService = createMock<StorageService>({
          setNx: async () => false,
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
        (eventService as any).storageService = createMock<StorageService>({
          setNx: async () => false,
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
          observableToArray(
            eventService.findByFilters([{}].map(Filter.fromFilterDto)),
          ),
        ).resolves.toEqual(events);

        await expect(
          observableToArray(
            eventService.findByFilters(
              [{ search: 'test' }].map(Filter.fromFilterDto),
            ),
          ),
        ).resolves.toEqual(events);

        await expect(
          observableToArray(
            eventService.findByFilters(
              [{}, { search: 'test' }].map(Filter.fromFilterDto),
            ),
          ),
        ).resolves.toEqual(events);
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

    describe('checkEventExists', () => {
      it('should return false when the event is ephemeral', async () => {
        expect(
          await eventService.checkEventExists(EPHEMERAL_EVENT),
        ).toBeFalsy();
      });

      it('should return false when the event does not exist', async () => {
        jest
          .spyOn(eventService['eventRepository'], 'findOne')
          .mockResolvedValue(null);

        expect(
          await eventService.checkEventExists(REPLACEABLE_EVENT),
        ).toBeFalsy();
        expect(
          await eventService.checkEventExists(PARAMETERIZED_REPLACEABLE_EVENT),
        ).toBeFalsy();
        expect(await eventService.checkEventExists(REGULAR_EVENT)).toBeFalsy();
      });

      it('should return true when the event exists', async () => {
        jest
          .spyOn(eventService['eventRepository'], 'findOne')
          .mockResolvedValue({} as Event);

        expect(
          await eventService.checkEventExists(REPLACEABLE_EVENT),
        ).toBeTruthy();
        expect(
          await eventService.checkEventExists(PARAMETERIZED_REPLACEABLE_EVENT),
        ).toBeTruthy();
        expect(await eventService.checkEventExists(REGULAR_EVENT)).toBeTruthy();
      });
    });
  });
});
