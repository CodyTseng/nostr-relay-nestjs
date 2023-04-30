import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import {
  createSignedEventMock,
  DELETION_EVENT,
  EPHEMERAL_EVENT,
  EVENT_IDS_TO_BE_DELETED,
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
  REPLACEABLE_EVENT,
} from '../../../seeds';
import { MessageType } from '../constants';
import { Event, Filter } from '../entities';
import { EventRepository } from '../repositories';
import { createCommandResultResponse, getTimestampInSeconds } from '../utils';
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
      const configService = createMock<ConfigService>({
        get: () => 'localhost',
      });
      const eventRepository = createMock<EventRepository>();
      eventService = new EventService(
        eventRepository,
        eventEmitter,
        lockService,
        configService,
      );
    });

    describe('handleSignedEvent', () => {
      it('should authenticate successfully', async () => {
        const client: any = { id: randomUUID() };
        const event = await createSignedEventMock({ challenge: client.id });
        eventService.handleSignedEvent(client, event);

        expect(client.pubkey).toBe(event.pubkey);
      });

      it('should authenticate failed', async () => {
        const client: any = { id: randomUUID() };

        const wrongChallengeSignedEvent = await createSignedEventMock({
          challenge: 'fake',
        });
        expect(
          eventService.handleSignedEvent(client, wrongChallengeSignedEvent),
        ).toEqual([
          MessageType.OK,
          wrongChallengeSignedEvent.id,
          false,
          'invalid: the challenge string is wrong',
        ]);
        expect(client.pubkey).toBeUndefined();

        const wrongRelaySignedEvent = await createSignedEventMock({
          challenge: client.id,
          relay: 'wss://fake',
        });
        expect(
          eventService.handleSignedEvent(client, wrongRelaySignedEvent),
        ).toEqual([
          MessageType.OK,
          wrongRelaySignedEvent.id,
          false,
          'invalid: the relay url is wrong',
        ]);
        expect(client.pubkey).toBeUndefined();

        const wrongRelayUrlSignedEvent = await createSignedEventMock({
          challenge: client.id,
          relay: 'fake',
        });
        expect(
          eventService.handleSignedEvent(client, wrongRelayUrlSignedEvent),
        ).toEqual([
          MessageType.OK,
          wrongRelayUrlSignedEvent.id,
          false,
          'invalid: the relay url is wrong',
        ]);
        expect(client.pubkey).toBeUndefined();

        const expiredSignedEvent = await createSignedEventMock({
          challenge: client.id,
          created_at: getTimestampInSeconds() - 20 * 60,
        });
        expect(
          eventService.handleSignedEvent(client, expiredSignedEvent),
        ).toEqual([
          MessageType.OK,
          expiredSignedEvent.id,
          false,
          'invalid: the created_at should be within 10 minutes',
        ]);
        expect(client.pubkey).toBeUndefined();

        expect(eventService.handleSignedEvent(client, REGULAR_EVENT)).toEqual([
          MessageType.OK,
          REGULAR_EVENT.id,
          false,
          'invalid: the kind is not 22242',
        ]);
        expect(client.pubkey).toBeUndefined();
      });
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
              ...REPLACEABLE_EVENT,
              created_at: REPLACEABLE_EVENT.created_at + 1,
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
        const mockDelete = jest.fn();
        const eventRepository = createMock<EventRepository>({
          find: async () =>
            EVENT_IDS_TO_BE_DELETED.map(
              (id) => ({ id, pubkey: DELETION_EVENT.pubkey } as Event),
            ),
          create: async () => true,
          delete: mockDelete,
        });
        (eventService as any).eventRepository = eventRepository;

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
        (eventService as any).eventRepository = eventRepository;

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
        (eventService as any).eventRepository = eventRepository;

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
        (eventService as any).eventRepository = eventRepository;

        expect(
          await eventService.countByFilters([{}].map(Filter.fromFilterDto)),
        ).toBe(COUNT);
      });
    });
  });
});
