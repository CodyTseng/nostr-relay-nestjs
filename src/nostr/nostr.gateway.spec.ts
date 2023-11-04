import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { from, lastValueFrom } from 'rxjs';
import { WebSocket, WebSocketServer } from 'ws';
import {
  PUBKEY_A,
  PUBKEY_B,
  REGULAR_EVENT_DTO,
  REPLACEABLE_EVENT_DTO,
  createTestEncryptedDirectMessageEvent,
  createTestEventDto,
  createTestSignedEventDto,
} from '../../seeds';
import { EventKind, MessageType } from './constants';
import { Event } from './entities';
import { NostrGateway } from './nostr.gateway';
import { EventService } from './services/event.service';
import { SubscriptionService } from './services/subscription.service';
import {
  CommandResultResponse,
  EndOfStoredEventResponse,
  EventResponse,
  createCommandResultResponse,
} from './utils';

describe('NostrGateway', () => {
  const FIND_EVENTS = [REGULAR_EVENT_DTO, REPLACEABLE_EVENT_DTO];

  let nostrGateway: NostrGateway;
  const mockSubscriptionServiceSetServer = jest.fn();
  const mockSubscriptionServiceClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const mockLogger = createMock<PinoLogger>();
    const mockConfigService = createMock<ConfigService>();
    const mockSubscriptionService = createMock<SubscriptionService>({
      setServer: mockSubscriptionServiceSetServer,
      clear: mockSubscriptionServiceClear,
    });
    const mockEventService = createMock<EventService>({
      handleEvent: async (event: Event) => {
        return [MessageType.OK, event.id, true, ''] as CommandResultResponse;
      },
      find: () => from(FIND_EVENTS.map(Event.fromEventDto)),
      findTopIds: async () => FIND_EVENTS.map((event) => event.id),
    });
    nostrGateway = new NostrGateway(
      mockLogger,
      mockSubscriptionService,
      mockEventService,
      mockConfigService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('EVENT', () => {
    it('should handle event successfully', async () => {
      jest
        .spyOn(nostrGateway['eventService'], 'checkEventExists')
        .mockResolvedValue(false);
      await expect(
        nostrGateway.event([MessageType.EVENT, REGULAR_EVENT_DTO]),
      ).resolves.toEqual([MessageType.OK, REGULAR_EVENT_DTO.id, true, '']);
    });

    it('should return validate error', async () => {
      jest
        .spyOn(nostrGateway['eventService'], 'checkEventExists')
        .mockResolvedValue(false);
      await expect(
        nostrGateway.event([
          MessageType.EVENT,
          { ...REGULAR_EVENT_DTO, sig: 'fake-sig' },
        ]),
      ).resolves.toEqual([
        MessageType.OK,
        REGULAR_EVENT_DTO.id,
        false,
        'invalid: signature is wrong',
      ]);
    });

    it('should return an error', async () => {
      const ERROR_MSG = 'test';

      jest
        .spyOn(nostrGateway['eventService'], 'checkEventExists')
        .mockResolvedValue(false);
      jest
        .spyOn(nostrGateway['eventService'], 'handleEvent')
        .mockImplementation(async () => {
          throw new Error(ERROR_MSG);
        });

      const event = createTestEventDto({});
      await expect(
        nostrGateway.event([MessageType.EVENT, event]),
      ).resolves.toEqual([
        MessageType.OK,
        event.id,
        false,
        'error: ' + ERROR_MSG,
      ]);
    });

    it('should return duplicate message', async () => {
      jest
        .spyOn(nostrGateway['eventService'], 'checkEventExists')
        .mockResolvedValue(true);
      await expect(
        nostrGateway.event([MessageType.EVENT, REGULAR_EVENT_DTO]),
      ).resolves.toEqual([
        MessageType.OK,
        REGULAR_EVENT_DTO.id,
        true,
        'duplicate: the event already exists',
      ]);
    });
  });

  describe('REQ', () => {
    it('should subscribe successfully', async () => {
      const subscriptionId = 'test:req';
      const responses: (EventResponse | EndOfStoredEventResponse)[] = [];

      const response$ = await nostrGateway.req({} as any, [
        MessageType.REQ,
        subscriptionId,
        {},
      ]);
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

    it('should reject when unauthenticated and request DM events', async () => {
      await expect(
        nostrGateway.req({} as any, [
          MessageType.REQ,
          'test:req',
          { kinds: [EventKind.ENCRYPTED_DIRECT_MESSAGE] },
        ]),
      ).rejects.toThrowError(
        "restricted: we can't serve DMs to unauthenticated users, does your client implement NIP-42?",
      );
    });

    it('should filter out unauthorized events', async () => {
      const encryptedDirectMessageEvent =
        createTestEncryptedDirectMessageEvent();
      (nostrGateway as any).eventService = createMock<EventService>({
        find: () => from([encryptedDirectMessageEvent]),
      });
      const subscriptionId = 'test:req';
      const responses: (EventResponse | EndOfStoredEventResponse)[] = [];

      const response$ = await nostrGateway.req({} as any, [
        MessageType.REQ,
        subscriptionId,
        {},
      ]);
      response$.subscribe((item) => responses.push(item));
      await lastValueFrom(response$);

      expect(responses).toEqual([[MessageType.EOSE, subscriptionId]]);

      const responses2: (EventResponse | EndOfStoredEventResponse)[] = [];

      const response2$ = await nostrGateway.req(
        {
          pubkey: PUBKEY_B,
        } as any,
        [MessageType.REQ, subscriptionId, {}],
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
        nostrGateway.close({} as any, [MessageType.CLOSE, subscriptionId]),
      ).not.toThrowError();
    });
  });

  describe('AUTH', () => {
    beforeEach(() => {
      (nostrGateway as any).domain = 'localhost';
    });

    it('should auth successfully', async () => {
      const challenge = 'challenge';
      const client = { id: challenge } as any;
      const event = createTestSignedEventDto({ challenge });
      expect(
        await nostrGateway.auth(client, [MessageType.AUTH, event]),
      ).toEqual(createCommandResultResponse(event.id, true));

      expect(client.pubkey).toBe(PUBKEY_A);
    });

    it('should auth failed', () => {
      const challenge = 'challenge';
      const client = { id: challenge } as any;
      const signedEvent = createTestSignedEventDto({ challenge });
      signedEvent.pubkey = 'fake-pubkey';
      nostrGateway.auth(client, [MessageType.AUTH, signedEvent]);

      expect(client.pubkey).toBeUndefined();
    });
  });

  describe('TOP', () => {
    it('should return top ids successfully', async () => {
      const subId = 'test';
      expect(
        await nostrGateway.top({} as any, [MessageType.TOP, subId, {}]),
      ).toEqual([MessageType.TOP, subId, FIND_EVENTS.map((event) => event.id)]);
    });

    it('should reject when unauthenticated and request DM events', async () => {
      await expect(
        nostrGateway.top({} as any, [
          MessageType.TOP,
          'test:req',
          { kinds: [EventKind.ENCRYPTED_DIRECT_MESSAGE] },
        ]),
      ).rejects.toThrowError(
        "restricted: we can't serve DMs to unauthenticated users, does your client implement NIP-42?",
      );
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
