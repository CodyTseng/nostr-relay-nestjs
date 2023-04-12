import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { lastValueFrom } from 'rxjs';
import { WebSocket, WebSocketServer } from 'ws';
import {
  CAUSE_ERROR_EVENT,
  REGULAR_EVENT,
  REPLACEABLE_EVENT,
} from '../../seeds';
import { NostrGateway } from './nostr.gateway';
import { Event } from './schemas';
import { EventService } from './services/event.service';
import { SubscriptionService } from './services/subscription.service';
import {
  createCommandResultResponse,
  createCountResponse,
  createEndOfStoredEventResponse,
  createEventResponse,
  EndOfStoredEventResponse,
  EventResponse,
} from './utils';

describe('NostrGateway', () => {
  const ERROR_MSG = 'test';
  const FIND_EVENTS = [REGULAR_EVENT, REPLACEABLE_EVENT];

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
        if (event.id === CAUSE_ERROR_EVENT.id) {
          throw new Error(ERROR_MSG);
        }
        return createCommandResultResponse(event.id, true);
      },
      findByFilters: async () => FIND_EVENTS,
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
      await expect(nostrGateway.event([REGULAR_EVENT])).resolves.toEqual(
        createCommandResultResponse(REGULAR_EVENT.id, true),
      );
    });

    it('should return validate error', async () => {
      await expect(
        nostrGateway.event([{ ...REGULAR_EVENT, sig: 'fake-sig' }]),
      ).resolves.toEqual(
        createCommandResultResponse(
          REGULAR_EVENT.id,
          false,
          'invalid: signature is wrong',
        ),
      );
    });

    it('should return an error', async () => {
      await expect(nostrGateway.event([CAUSE_ERROR_EVENT])).resolves.toEqual(
        createCommandResultResponse(
          CAUSE_ERROR_EVENT.id,
          false,
          'error: ' + ERROR_MSG,
        ),
      );
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
        ...FIND_EVENTS.map((event) =>
          createEventResponse(subscriptionId, event),
        ),
        createEndOfStoredEventResponse(subscriptionId),
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

      expect(await nostrGateway.count([subscriptionId, {}])).toEqual(
        createCountResponse(subscriptionId, FIND_EVENTS.length),
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

    it('should clear all subscriptions of the client when it disconnects', () => {
      const mockClient = createMock<WebSocket>();
      nostrGateway.handleDisconnect(mockClient);
      expect(mockSubscriptionServiceClear).toBeCalledWith(mockClient);
    });
  });
});
