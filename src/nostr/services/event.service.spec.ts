import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PinoLogger } from 'nestjs-pino';
import {
  createTestSignedEvent,
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
import { EventKind } from '../constants';

describe('EventService', () => {
  describe('handleEvent', () => {
    let mockEmit: jest.Mock;
    let eventService: EventService;

    beforeEach(() => {
      mockEmit = jest.fn();
      eventService = new EventService(
        createMock<EventRepository>(),
        createMock<EventSearchRepository>(),
        createMock<EventEmitter2>({
          emit: mockEmit,
        }),
        createMock<StorageService>(),
        createMock<PinoLogger>(),
        createMock<ConfigService>({
          get: jest.fn().mockReturnValue({ slowExecutionThreshold: 100 }),
        }),
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('handleRegularEvent', () => {
      it('should save the event successfully', async () => {
        jest
          .spyOn(eventService['eventRepository'], 'create')
          .mockResolvedValue(true);

        await expect(eventService.handleEvent(REGULAR_EVENT)).resolves.toEqual(
          createCommandResultResponse(REGULAR_EVENT.id, true),
        );
        expect(mockEmit).toHaveBeenCalled();
      });

      it('should return duplicate when the event already exists', async () => {
        jest
          .spyOn(eventService['eventRepository'], 'create')
          .mockResolvedValue(false);

        await expect(eventService.handleEvent(REGULAR_EVENT)).resolves.toEqual(
          createCommandResultResponse(
            REGULAR_EVENT.id,
            true,
            'duplicate: the event already exists',
          ),
        );
        expect(mockEmit).not.toHaveBeenCalled();
      });
    });

    describe('handleReplaceableEvent', () => {
      it('should replace the event successfully', async () => {
        jest
          .spyOn(eventService['eventRepository'], 'findOne')
          .mockResolvedValue(null);
        jest
          .spyOn(eventService['eventRepository'], 'replace')
          .mockResolvedValue(true);

        await expect(
          eventService.handleEvent(REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(REPLACEABLE_EVENT.id, true),
        );
        expect(mockEmit).toHaveBeenCalled();
      });

      it('should replace the old event successfully', async () => {
        const now = Date.now();
        const oldEvent = new Event();
        oldEvent.id = 'a';
        oldEvent.createdAt = now - 1000;
        oldEvent.kind = EventKind.SET_METADATA;
        oldEvent.pubkey = 'pubkey';
        jest
          .spyOn(eventService['eventRepository'], 'findOne')
          .mockResolvedValue(oldEvent);
        jest
          .spyOn(eventService['eventRepository'], 'replace')
          .mockResolvedValue(true);

        const newEvent = new Event();
        newEvent.id = 'b';
        newEvent.createdAt = now;
        newEvent.kind = EventKind.SET_METADATA;
        newEvent.pubkey = 'pubkey';
        await expect(eventService.handleEvent(newEvent)).resolves.toEqual(
          createCommandResultResponse(newEvent.id, true),
        );
        expect(mockEmit).toHaveBeenCalled();
      });

      it('should return duplicate when the created_at of the old event is the same as the new event and the id of the old event is less than the new event', async () => {
        const now = Date.now();
        const oldEvent = new Event();
        oldEvent.id = 'a';
        oldEvent.createdAt = now;
        oldEvent.kind = EventKind.SET_METADATA;
        oldEvent.pubkey = 'pubkey';
        jest
          .spyOn(eventService['eventRepository'], 'findOne')
          .mockResolvedValue(oldEvent);
        jest
          .spyOn(eventService['eventRepository'], 'replace')
          .mockResolvedValue(true);

        const newEvent = new Event();
        newEvent.id = 'b';
        newEvent.createdAt = now;
        newEvent.kind = EventKind.SET_METADATA;
        newEvent.pubkey = 'pubkey';
        await expect(eventService.handleEvent(newEvent)).resolves.toEqual(
          createCommandResultResponse(
            newEvent.id,
            true,
            'duplicate: the event already exists',
          ),
        );
        expect(mockEmit).not.toHaveBeenCalled();
      });

      it('should return duplicate when the event already exists', async () => {
        jest
          .spyOn(eventService['eventRepository'], 'findOne')
          .mockResolvedValue(REPLACEABLE_EVENT);
        jest
          .spyOn(eventService['eventRepository'], 'replace')
          .mockResolvedValue(false);

        await expect(
          eventService.handleEvent(REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(
            REPLACEABLE_EVENT.id,
            true,
            'duplicate: the event already exists',
          ),
        );
        expect(mockEmit).not.toHaveBeenCalled();
      });

      it('should return duplicate when the event older than a similar event that already exists', async () => {
        jest
          .spyOn(eventService['eventRepository'], 'findOne')
          .mockResolvedValue(
            Event.fromEventDto({
              ...REPLACEABLE_EVENT_DTO,
              created_at: REPLACEABLE_EVENT.createdAt + 1,
            }),
          );
        jest
          .spyOn(eventService['eventRepository'], 'replace')
          .mockResolvedValue(true);

        await expect(
          eventService.handleEvent(REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(
            REPLACEABLE_EVENT.id,
            true,
            'duplicate: the event already exists',
          ),
        );
        expect(mockEmit).not.toHaveBeenCalled();
      });

      it('should return rate-limited when acquiring the lock fails', async () => {
        jest
          .spyOn(eventService['storageService'], 'setNx')
          .mockResolvedValue(false);

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
        jest
          .spyOn(eventService['eventRepository'], 'findOne')
          .mockResolvedValue(null);
        jest
          .spyOn(eventService['eventRepository'], 'replace')
          .mockResolvedValue(true);

        await expect(
          eventService.handleEvent(PARAMETERIZED_REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(PARAMETERIZED_REPLACEABLE_EVENT.id, true),
        );
        expect(mockEmit).toHaveBeenCalled();
      });

      it('should return rate-limited when acquiring the lock fails', async () => {
        jest
          .spyOn(eventService['storageService'], 'setNx')
          .mockResolvedValue(false);

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
        expect(mockEmit).toHaveBeenCalled();
      });

      it('should discard signed event', async () => {
        await expect(
          eventService.handleEvent(createTestSignedEvent()),
        ).resolves.toBeUndefined();
        expect(mockEmit).not.toHaveBeenCalled();
      });
    });

    describe('find', () => {
      it('should return events', async () => {
        const events = [REGULAR_EVENT, REPLACEABLE_EVENT];
        jest
          .spyOn(eventService['eventSearchRepository'], 'find')
          .mockResolvedValue(events);
        jest
          .spyOn(eventService['eventRepository'], 'find')
          .mockResolvedValue(events);

        await expect(
          observableToArray(eventService.find([{}].map(Filter.fromFilterDto))),
        ).resolves.toEqual(events);

        await expect(
          observableToArray(
            eventService.find([{ search: 'test' }].map(Filter.fromFilterDto)),
          ),
        ).resolves.toEqual(events);

        await expect(
          observableToArray(
            eventService.find(
              [{}, { search: 'test' }].map(Filter.fromFilterDto),
            ),
          ),
        ).resolves.toEqual(events);
      });

      it('should cache result', async () => {
        eventService = new EventService(
          createMock<EventRepository>(),
          createMock<EventSearchRepository>(),
          createMock<EventEmitter2>({
            emit: mockEmit,
          }),
          createMock<StorageService>(),
          createMock<PinoLogger>(),
          createMock<ConfigService>({
            get: jest.fn().mockReturnValue({ filterResultCacheTtl: 1000 }),
          }),
        );

        const events = [REGULAR_EVENT, REPLACEABLE_EVENT];
        const findSpy = jest
          .spyOn(eventService['eventRepository'], 'find')
          .mockResolvedValue(events);

        await expect(
          observableToArray(
            eventService.find([{}, {}].map(Filter.fromFilterDto)),
          ),
        ).resolves.toEqual(events);

        await expect(
          observableToArray(
            eventService.find([{}, {}].map(Filter.fromFilterDto)),
          ),
        ).resolves.toEqual(events);

        expect(findSpy).toHaveBeenCalledTimes(1);
      });

      it('should log warn if execution time is greater than `slowExecutionThreshold`', async () => {
        jest
          .spyOn(eventService['eventRepository'], 'find')
          .mockImplementation(async () => {
            await new Promise((resolve) => setTimeout(resolve, 200));
            return [];
          });
        const warnLoggerSpy = jest.spyOn(eventService['logger'], 'warn');

        await expect(
          observableToArray(eventService.find([Filter.fromFilterDto({})])),
        ).resolves.toEqual([]);

        expect(warnLoggerSpy).toHaveBeenCalled();
      });
    });

    describe('findTopIdsWithScore', () => {
      it('should return top ids', async () => {
        jest
          .spyOn(eventService['eventSearchRepository'], 'findTopIdsWithScore')
          .mockResolvedValue([
            { id: REGULAR_EVENT.id, score: REGULAR_EVENT.createdAt },
          ]);
        jest
          .spyOn(eventService['eventRepository'], 'findTopIdsWithScore')
          .mockResolvedValue([
            { id: REPLACEABLE_EVENT.id, score: REPLACEABLE_EVENT.createdAt },
          ]);

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
