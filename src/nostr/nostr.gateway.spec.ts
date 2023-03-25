import { createMock } from '@golevelup/ts-jest';
import { PinoLogger } from 'nestjs-pino';
import { lastValueFrom } from 'rxjs';
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
  createEndOfStoredEventResponse,
  createEventResponse,
  EndOfStoredEventResponse,
  EventResponse,
} from './utils';

describe('NostrGateway', () => {
  const ERROR_MSG = 'test';
  const FIND_EVENTS = [REGULAR_EVENT, REPLACEABLE_EVENT];
  const mockLogger = createMock<PinoLogger>();
  const mockSubscriptionService = createMock<SubscriptionService>();
  const mockEventService = createMock<EventService>({
    handleEvent: async (event: Event) => {
      if (event.id === CAUSE_ERROR_EVENT.id) {
        throw new Error(ERROR_MSG);
      }
      return createCommandResultResponse(event.id, true);
    },
    findByFilters: async () => FIND_EVENTS,
  });
  const nostrGateway = new NostrGateway(
    mockLogger,
    mockSubscriptionService,
    mockEventService,
  );

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
});
