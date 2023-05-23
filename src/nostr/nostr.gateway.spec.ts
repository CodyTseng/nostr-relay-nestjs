import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { lastValueFrom } from 'rxjs';
import { WebSocket, WebSocketServer } from 'ws';
import {
  CAUSE_ERROR_EVENT_DTO,
  createEncryptedDirectMessageEventMock,
  createSignedEventDtoMock,
  REGULAR_EVENT_DTO,
  REPLACEABLE_EVENT_DTO,
  TEST_PUBKEY,
} from '../../seeds';
import { EventKind, MessageType } from './constants';
import { Event } from './entities';
import { NostrGateway } from './nostr.gateway';
import { EventService } from './services/event.service';
import { SubscriptionService } from './services/subscription.service';
import {
  CommandResultResponse,
  createCommandResultResponse,
  EndOfStoredEventResponse,
  EventResponse,
} from './utils';

describe('NostrGateway', () => {
  const ERROR_MSG = 'test';
  const FIND_EVENTS = [REGULAR_EVENT_DTO, REPLACEABLE_EVENT_DTO];

  let nostrGateway: NostrGateway;
  let mockSubscriptionServiceSetServer: jest.Mock;
  let mockSubscriptionServiceClear: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockLogger = createMock<PinoLogger>();
    mockSubscriptionServiceSetServer = jest.fn();
    mockSubscriptionServiceClear = jest.fn();
    const mockConfigService = createMock<ConfigService>();
    const mockSubscriptionService = createMock<SubscriptionService>({
      setServer: mockSubscriptionServiceSetServer,
      clear: mockSubscriptionServiceClear,
    });
    const mockEventService = createMock<EventService>({
      handleEvent: async (event: Event) => {
        if (event.id === CAUSE_ERROR_EVENT_DTO.id) {
          throw new Error(ERROR_MSG);
        }
        return [MessageType.OK, event.id, true, ''] as CommandResultResponse;
      },
      findByFilters: async () => FIND_EVENTS.map(Event.fromEventDto),
      countByFilters: async () => FIND_EVENTS.length,
    });
    nostrGateway = new NostrGateway(
      mockLogger,
      mockSubscriptionService,
      mockEventService,
      mockConfigService,
    );
  });

  describe('EVENT', () => {
    it('should handle event successfully', async () => {
      await expect(nostrGateway.event([REGULAR_EVENT_DTO])).resolves.toEqual([
        MessageType.OK,
        REGULAR_EVENT_DTO.id,
        true,
        '',
      ]);
    });

    it('should return validate error', async () => {
      await expect(
        nostrGateway.event([{ ...REGULAR_EVENT_DTO, sig: 'fake-sig' }]),
      ).resolves.toEqual([
        MessageType.OK,
        REGULAR_EVENT_DTO.id,
        false,
        'invalid: signature is wrong',
      ]);
    });

    it('should return an error', async () => {
      await expect(
        nostrGateway.event([CAUSE_ERROR_EVENT_DTO]),
      ).resolves.toEqual([
        MessageType.OK,
        CAUSE_ERROR_EVENT_DTO.id,
        false,
        'error: ' + ERROR_MSG,
      ]);
    });
  });

  describe('REQ', () => {
    it('should subscribe successfully', async () => {
      const subscriptionId = 'test:req';
      const responses: (EventResponse | EndOfStoredEventResponse)[] = [];

      const response$ = await nostrGateway.req({} as any, [subscriptionId, {}]);
      response$.subscribe((item) => responses.push(item));
      await lastValueFrom(response$);

      expect(responses).toEqual([
        ...FIND_EVENTS.map((event) => [
          MessageType.EVENT,
          subscriptionId,
          event,
        ]),
        [MessageType.EOSE, subscriptionId],
      ]);
    });

    it('should reject when unauthenticated and count DM events', async () => {
      await expect(
        nostrGateway.req({} as any, [
          'test:req',
          { kinds: [EventKind.ENCRYPTED_DIRECT_MESSAGE] },
        ]),
      ).rejects.toThrowError(
        "restricted: we can't serve DMs to unauthenticated users, does your client implement NIP-42?",
      );
    });

    it('should filter out unauthorized events', async () => {
      const encryptedDirectMessageEvent =
        await createEncryptedDirectMessageEventMock();
      (nostrGateway as any).eventService = createMock<EventService>({
        findByFilters: async () => [encryptedDirectMessageEvent],
      });
      const subscriptionId = 'test:req';
      const responses: (EventResponse | EndOfStoredEventResponse)[] = [];

      const response$ = await nostrGateway.req({} as any, [subscriptionId, {}]);
      response$.subscribe((item) => responses.push(item));
      await lastValueFrom(response$);

      expect(responses).toEqual([[MessageType.EOSE, subscriptionId]]);

      const responses2: (EventResponse | EndOfStoredEventResponse)[] = [];

      const response2$ = await nostrGateway.req(
        {
          pubkey:
            'a734cca70ca3c08511e3c2d5a80827182e2804401fb28013a8f79da4dd6465ac',
        } as any,
        [subscriptionId, {}],
      );
      response2$.subscribe((item) => responses2.push(item));
      await lastValueFrom(response2$);

      expect(responses2).toEqual([
        [
          MessageType.EVENT,
          subscriptionId,
          encryptedDirectMessageEvent.toEventDto(),
        ],
        [MessageType.EOSE, subscriptionId],
      ]);
    });
  });

  describe('CLOSE', () => {
    it('should close successfully', () => {
      const subscriptionId = 'test:close';

      expect(() =>
        nostrGateway.close({} as any, [subscriptionId]),
      ).not.toThrowError();
    });
  });

  describe('COUNT', () => {
    it('should count successfully', async () => {
      const subscriptionId = 'test:count';

      expect(await nostrGateway.count({} as any, [subscriptionId, {}])).toEqual(
        [MessageType.COUNT, subscriptionId, { count: FIND_EVENTS.length }],
      );
    });

    it('should reject when unauthenticated and count DM events', async () => {
      await expect(
        nostrGateway.count({} as any, [
          'test:req',
          { kinds: [EventKind.ENCRYPTED_DIRECT_MESSAGE] },
        ]),
      ).rejects.toThrowError(
        "restricted: we can't serve DMs to unauthenticated users, does your client implement NIP-42?",
      );
    });
  });

  describe('AUTH', () => {
    it('should auth successfully', async () => {
      (nostrGateway as any).eventService = createMock<EventService>({
        handleSignedEvent: (client, event) => {
          client.pubkey = TEST_PUBKEY;
          return createCommandResultResponse(event.id, true);
        },
      });
      const challenge = 'challenge';
      const client = { id: challenge } as any;
      await nostrGateway.auth(client, [
        await createSignedEventDtoMock({ challenge }),
      ]);

      expect(client.pubkey).toBe(TEST_PUBKEY);
    });

    it('should auth failed', async () => {
      (nostrGateway as any).eventService = createMock<EventService>({
        handleSignedEvent: (client, event) => {
          client.pubkey = TEST_PUBKEY;
          return createCommandResultResponse(event.id, true);
        },
      });
      const challenge = 'challenge';
      const client = { id: challenge } as any;
      await nostrGateway.auth(client, [
        await createSignedEventDtoMock({ pubkey: 'fake-pubkey', challenge }),
      ]);

      expect(client.pubkey).toBeUndefined();
    });
  });

  describe('Hooks', () => {
    it('should set server to subscriptionService after init', () => {
      const mockWebSocketServer = createMock<WebSocketServer>();
      nostrGateway.afterInit(mockWebSocketServer);
      expect(mockSubscriptionServiceSetServer).toBeCalledWith(
        mockWebSocketServer,
      );
    });

    it('should set an uuid and send AUTH message when it connects', () => {
      const mockSend = jest.fn();
      const mockClient = createMock<WebSocket>({
        send: mockSend,
      });
      nostrGateway.handleConnection(mockClient);
      expect(mockClient.id).toBeDefined();
      expect(mockSend).toBeCalledWith(
        JSON.stringify([MessageType.AUTH, mockClient.id]),
      );
    });

    it('should clear all subscriptions of the client when it disconnects', () => {
      const mockClient = createMock<WebSocket>();
      nostrGateway.handleDisconnect(mockClient);
      expect(mockSubscriptionServiceClear).toBeCalledWith(mockClient);
    });
  });
});
