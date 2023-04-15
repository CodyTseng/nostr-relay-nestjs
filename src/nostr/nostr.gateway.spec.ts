import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { lastValueFrom } from 'rxjs';
import { WebSocket, WebSocketServer } from 'ws';
import {
  CAUSE_ERROR_EVENT_SCHEMA,
  REGULAR_EVENT_SCHEMA,
  REPLACEABLE_EVENT_SCHEMA,
} from '../../seeds';
import { MessageType } from './constants';
import { Event } from './entities';
import { NostrGateway } from './nostr.gateway';
import { EventService } from './services/event.service';
import { SubscriptionService } from './services/subscription.service';
import {
  CommandResultResponse,
  EndOfStoredEventResponse,
  EventResponse,
} from './utils';

describe('NostrGateway', () => {
  const ERROR_MSG = 'test';
  const FIND_EVENTS = [REGULAR_EVENT_SCHEMA, REPLACEABLE_EVENT_SCHEMA];

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
        if (event.id === CAUSE_ERROR_EVENT_SCHEMA.id) {
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
      await expect(nostrGateway.event([REGULAR_EVENT_SCHEMA])).resolves.toEqual(
        [MessageType.OK, REGULAR_EVENT_SCHEMA.id, true, ''],
      );
    });

    it('should return validate error', async () => {
      await expect(
        nostrGateway.event([{ ...REGULAR_EVENT_SCHEMA, sig: 'fake-sig' }]),
      ).resolves.toEqual([
        MessageType.OK,
        REGULAR_EVENT_SCHEMA.id,
        false,
        'invalid: signature is wrong',
      ]);
    });

    it('should return an error', async () => {
      await expect(
        nostrGateway.event([CAUSE_ERROR_EVENT_SCHEMA]),
      ).resolves.toEqual([
        MessageType.OK,
        CAUSE_ERROR_EVENT_SCHEMA.id,
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

      expect(await nostrGateway.count([subscriptionId, {}])).toEqual([
        MessageType.COUNT,
        subscriptionId,
        { count: FIND_EVENTS.length },
      ]);
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

    it('should clear all subscriptions of the client when it disconnects', () => {
      const mockClient = createMock<WebSocket>();
      nostrGateway.handleDisconnect(mockClient);
      expect(mockSubscriptionServiceClear).toBeCalledWith(mockClient);
    });
  });
});
