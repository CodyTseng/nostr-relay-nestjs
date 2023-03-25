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
import { EventRepository } from '../repositories';
import { Event } from '../schemas';
import { createCommandResultResponse } from '../utils';
import { EventService } from './event.service';

describe('EventService', () => {
  describe('handleEvent', () => {
    let eventEmitter: EventEmitter2, emitMock: jest.Mock;

    beforeEach(() => {
      emitMock = jest.fn();
      eventEmitter = createMock<EventEmitter2>({
        emit: emitMock,
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
        expect(emitMock).toBeCalled();
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
        expect(emitMock).not.toBeCalled();
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
        expect(emitMock).toBeCalled();
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
        expect(emitMock).not.toBeCalled();
      });

      it('should return duplicate when the event older than a similar event that already exists', async () => {
        const eventRepository = createMock<EventRepository>({
          findOne: async () => ({
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
        expect(emitMock).not.toBeCalled();
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
        expect(emitMock).toBeCalled();
      });
    });

    describe('handleEphemeralEvent', () => {
      it('should broadcast the event', async () => {
        const eventRepository = createMock<EventRepository>();
        const eventService = new EventService(eventRepository, eventEmitter);

        await expect(
          eventService.handleEvent(EPHEMERAL_EVENT),
        ).resolves.toBeUndefined();
        expect(emitMock).toBeCalled();
      });
    });

    describe('handleDeletionEvent', () => {
      it('should delete specified events', async () => {
        const deleteMock = jest.fn();
        const eventRepository = createMock<EventRepository>({
          find: async () =>
            EVENT_IDS_TO_BE_DELETED.map(
              (id) => ({ id, pubkey: DELETION_EVENT.pubkey } as Event),
            ),
          create: async () => true,
          delete: deleteMock,
        });
        const eventService = new EventService(eventRepository, eventEmitter);

        await eventService.handleEvent(DELETION_EVENT);
        expect(emitMock).toBeCalled();
        expect(deleteMock).toHaveBeenCalledWith(
          DELETION_EVENT.pubkey,
          EVENT_IDS_TO_BE_DELETED,
        );
      });

      it('should ignore events with different pubkey', async () => {
        const deleteMock = jest.fn();
        const eventRepository = createMock<EventRepository>({
          find: async () =>
            EVENT_IDS_TO_BE_DELETED.map(
              (id) => ({ id, pubkey: 'fake-pubkey' } as Event),
            ),
          create: async () => true,
          delete: deleteMock,
        });
        const eventService = new EventService(eventRepository, eventEmitter);

        await eventService.handleEvent(DELETION_EVENT);
        expect(emitMock).toBeCalled();
        expect(deleteMock).toHaveBeenCalledWith(DELETION_EVENT.pubkey, []);
      });
    });

    describe('findByFilters', () => {
      it('should return events', async () => {
        const events = [REGULAR_EVENT, REPLACEABLE_EVENT, DELETION_EVENT];
        const eventRepository = createMock<EventRepository>({
          find: async () => events,
        });

        const eventService = new EventService(eventRepository, eventEmitter);

        await expect(eventService.findByFilters([{}])).resolves.toEqual(events);
      });
    });
  });
});
