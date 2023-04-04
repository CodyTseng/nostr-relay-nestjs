import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { get } from 'lodash';
import { PinoLogger } from 'nestjs-pino';
import { lastValueFrom } from 'rxjs';
import { WebSocket, WebSocketServer } from 'ws';
import {
  CAUSE_ERROR_EVENT,
  FUTURE_REGULAR_EVENT,
  LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT,
  LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT,
  LEADING_8_ZERO_BITS_REGULAR_EVENT,
  REGULAR_EVENT,
  REPLACEABLE_EVENT,
} from '../../seeds';
import { NostrGateway } from './nostr.gateway';
import { Event } from './schemas';
import { EventService } from './services/event.service';
import { SubscriptionService } from './services/subscription.service';
import {
  createCommandResultResponse,
  createEndOfStoredEventResponse,
  createEventResponse,
  EndOfStoredEventResponse,
  EventResponse,
} from './utils';

describe('NostrGateway', () => {
  const ERROR_MSG = 'test';
  const FIND_EVENTS = [REGULAR_EVENT, REPLACEABLE_EVENT];
  const CONFIG = {
    limit: { createdAt: { upper: 60 }, eventId: { minLeadingZeroBits: 0 } },
  };

  let nostrGateway: NostrGateway;
  let mockSubscriptionServiceSetServer: jest.Mock;
  let mockSubscriptionServiceClear: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockLogger = createMock<PinoLogger>();
    mockSubscriptionServiceSetServer = jest.fn();
    mockSubscriptionServiceClear = jest.fn();
    const mockConfigService = createMock<ConfigService>({
      get: (path) => get(CONFIG, path),
    });
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

    it('should return event id is wrong', async () => {
      const fakeEventId = 'fake-id';

      await expect(
        nostrGateway.event([{ ...REGULAR_EVENT, id: fakeEventId }]),
      ).resolves.toEqual(
        createCommandResultResponse(fakeEventId, false, 'invalid: id is wrong'),
      );
    });

    it('should return signature is wrong', async () => {
      const fakeSig = 'fake-sig';

      await expect(
        nostrGateway.event([{ ...REGULAR_EVENT, sig: fakeSig }]),
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

    it('should return invalid created_at', async () => {
      await expect(nostrGateway.event([FUTURE_REGULAR_EVENT])).resolves.toEqual(
        createCommandResultResponse(
          FUTURE_REGULAR_EVENT.id,
          false,
          'invalid: created_at must not be later than 60 seconds from the current time.',
        ),
      );
    });

    it('should handle successfully when event pow is enough', async () => {
      (nostrGateway as any).limitConfig = {
        createdAt: { upper: 60 },
        eventId: { minLeadingZeroBits: 4 },
      };

      await expect(
        nostrGateway.event([LEADING_8_ZERO_BITS_REGULAR_EVENT]),
      ).resolves.toEqual(
        createCommandResultResponse(LEADING_8_ZERO_BITS_REGULAR_EVENT.id, true),
      );
      await expect(
        nostrGateway.event([
          LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT,
        ]),
      ).resolves.toEqual(
        createCommandResultResponse(
          LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT.id,
          true,
        ),
      );
    });

    it('should return pow is less', async () => {
      (nostrGateway as any).limitConfig = {
        createdAt: { upper: 60 },
        eventId: { minLeadingZeroBits: 16 },
      };

      await expect(
        nostrGateway.event([LEADING_8_ZERO_BITS_REGULAR_EVENT]),
      ).resolves.toEqual(
        createCommandResultResponse(
          LEADING_8_ZERO_BITS_REGULAR_EVENT.id,
          false,
          'pow: difficulty 8 is less than 16',
        ),
      );
      await expect(
        nostrGateway.event([LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT]),
      ).resolves.toEqual(
        createCommandResultResponse(
          LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT.id,
          false,
          'pow: difficulty 8 is less than 16',
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
