import { createMock } from '@golevelup/ts-jest';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  DELETION_EVENT,
  EPHEMERAL_EVENT,
  EVENT_IDS_TO_BE_DELETED,
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
  REPLACEABLE_EVENT,
} from '../../../seeds';
import { Event, Filter } from '../entities';
import { EventRepository } from '../repositories';
import { createCommandResultResponse } from '../utils';
import { EventService } from './event.service';

describe('EventService', () => {
  describe('handleEvent', () => {
    let eventEmitter: EventEmitter2, mockEmit: jest.Mock;

    beforeEach(() => {
      mockEmit = jest.fn();
      eventEmitter = createMock<EventEmitter2>({
        emit: mockEmit,
      });
    });

    describe('handleRegularEvent', () => {
      it('should save the event successfully', async () => {
        const eventRepository = createMock<EventRepository>({
          create: async () => true,
        });
        const eventService = new EventService(eventRepository, eventEmitter);

        await expect(eventService.handleEvent(REGULAR_EVENT)).resolves.toEqual(
          createCommandResultResponse(REGULAR_EVENT.id, true),
        );
        expect(mockEmit).toBeCalled();
      });

      it('should return duplicate when the event already exists', async () => {
        const eventRepository = createMock<EventRepository>({
          create: async () => false,
        });
        const eventService = new EventService(eventRepository, eventEmitter);

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
        const eventService = new EventService(eventRepository, eventEmitter);

        await expect(
          eventService.handleEvent(REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(REPLACEABLE_EVENT.id, true),
        );
        expect(mockEmit).toBeCalled();
      });

      it('should return duplicate when the event already exists', async () => {
        const eventRepository = createMock<EventRepository>({
          findOne: async () => null,
          replace: async () => false,
        });
        const eventService = new EventService(eventRepository, eventEmitter);

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
              ...REPLACEABLE_EVENT,
              created_at: REPLACEABLE_EVENT.created_at + 1,
            }),
          replace: async () => true,
        });
        const eventService = new EventService(eventRepository, eventEmitter);

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
    });

    describe('handleParameterizedReplaceableEvent', () => {
      it('should replace the event successfully', async () => {
        const eventRepository = createMock<EventRepository>({
          findOne: async () => null,
          replace: async () => true,
        });
        const eventService = new EventService(eventRepository, eventEmitter);

        await expect(
          eventService.handleEvent(PARAMETERIZED_REPLACEABLE_EVENT),
        ).resolves.toEqual(
          createCommandResultResponse(PARAMETERIZED_REPLACEABLE_EVENT.id, true),
        );
        expect(mockEmit).toBeCalled();
      });
    });

    describe('handleEphemeralEvent', () => {
      it('should broadcast the event', async () => {
        const eventRepository = createMock<EventRepository>();
        const eventService = new EventService(eventRepository, eventEmitter);

        await expect(
          eventService.handleEvent(EPHEMERAL_EVENT),
        ).resolves.toBeUndefined();
        expect(mockEmit).toBeCalled();
      });
    });

    describe('handleDeletionEvent', () => {
      it('should delete specified events', async () => {
        const mockDelete = jest.fn();
        const eventRepository = createMock<EventRepository>({
          find: async () =>
            EVENT_IDS_TO_BE_DELETED.map(
              (id) => ({ id, pubkey: DELETION_EVENT.pubkey } as Event),
            ),
          create: async () => true,
          delete: mockDelete,
        });
        const eventService = new EventService(eventRepository, eventEmitter);

        await eventService.handleEvent(DELETION_EVENT);
        expect(mockEmit).toBeCalled();
        expect(mockDelete).toHaveBeenCalledWith(
          DELETION_EVENT.pubkey,
          EVENT_IDS_TO_BE_DELETED,
        );
      });

      it('should ignore events with different pubkey', async () => {
        const mockDelete = jest.fn();
        const eventRepository = createMock<EventRepository>({
          find: async () =>
            EVENT_IDS_TO_BE_DELETED.map(
              (id) => ({ id, pubkey: 'fake-pubkey' } as Event),
            ),
          create: async () => true,
          delete: mockDelete,
        });
        const eventService = new EventService(eventRepository, eventEmitter);

        await eventService.handleEvent(DELETION_EVENT);
        expect(mockEmit).toBeCalled();
        expect(mockDelete).toHaveBeenCalledWith(DELETION_EVENT.pubkey, []);
      });
    });

    describe('findByFilters', () => {
      it('should return events', async () => {
        const events = [REGULAR_EVENT, REPLACEABLE_EVENT, DELETION_EVENT];
        const eventRepository = createMock<EventRepository>({
          find: async () => events,
        });

        const eventService = new EventService(eventRepository, eventEmitter);

        await expect(
          eventService.findByFilters([{}].map(Filter.fromFilterDto)),
        ).resolves.toEqual(events);
      });
    });

    describe('countByFilters', () => {
      it('should return count', async () => {
        const COUNT = 10;
        const eventRepository = createMock<EventRepository>({
          count: async () => COUNT,
        });

        const eventService = new EventService(eventRepository, eventEmitter);

        expect(
          await eventService.countByFilters([{}].map(Filter.fromFilterDto)),
        ).toBe(COUNT);
      });
    });
  });
});
