import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Event, IncomingReqMessage, MessageType } from '@nostr-relay/common';
import { PinoLogger } from 'nestjs-pino';
import { WotService } from 'src/modules/wot/wot.service';
import { WebSocket } from 'ws';
import { ValidationError } from 'zod-validation-error';
import { MetricService } from '../../metric/metric.service';
import { EventRepository } from '../../repositories/event.repository';
import { NostrRelayLogger } from '../../share/nostr-relay-logger.service';
import { NostrRelayService } from './nostr-relay.service';

describe('NostrRelayService', () => {
  let nostrRelayService: NostrRelayService;
  let metricService: MetricService;

  beforeEach(async () => {
    metricService = createMock<MetricService>();
    nostrRelayService = new NostrRelayService(
      createMock<PinoLogger>(),
      metricService,
      createMock<NostrRelayLogger>(),
      createMock<EventRepository>(),
      createMock<ConfigService>({
        get: jest.fn().mockImplementation((key) => {
          const config = {
            limit: {
              maxSubscriptionsPerClient: 20,
              minPowDifficulty: 8,
              blacklist: ['black'],
              whitelist: ['white'],
            },
            messageHandling: {
              event: true,
              req: true,
              close: true,
              top: true,
              auth: true,
            },
          };
          return config[key];
        }),
      }),
      createMock<WotService>(),
    );
  });

  afterEach(() => {
    nostrRelayService.onApplicationShutdown();
  });

  describe('constructor', () => {
    it('should create NostrRelayService', () => {
      expect(nostrRelayService).toBeDefined();
    });
  });

  describe('handleConnection', () => {
    it('should handle connection', () => {
      const fakeRelayHandleConnection = jest
        .spyOn(nostrRelayService['relay'], 'handleConnection')
        .mockReturnValue();
      const fakeMetricServiceIncrementConnectionCount = jest.spyOn(
        metricService,
        'incrementConnectionCount',
      );
      const client = createMock<WebSocket>();
      nostrRelayService.handleConnection(client);
      expect(fakeRelayHandleConnection).toHaveBeenCalledWith(client, 'unknown');
      expect(fakeMetricServiceIncrementConnectionCount).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnect', () => {
      const fakeRelayHandleDisconnect = jest.spyOn(
        nostrRelayService,
        'handleDisconnect',
      );
      const fakeMetricServiceDecrementConnectionCount = jest.spyOn(
        metricService,
        'decrementConnectionCount',
      );
      const client = createMock<WebSocket>();
      nostrRelayService.handleDisconnect(client);
      expect(fakeRelayHandleDisconnect).toHaveBeenCalledWith(client);
      expect(fakeMetricServiceDecrementConnectionCount).toHaveBeenCalled();
    });
  });

  describe('handleMessage', () => {
    it('should handle message', async () => {
      jest
        .spyOn(nostrRelayService['validator'], 'validateIncomingMessage')
        .mockImplementation(async (data) => data as IncomingReqMessage);
      const fakeRelayHandleMessage = jest
        .spyOn(nostrRelayService['relay'], 'handleMessage')
        .mockResolvedValue();
      const fakeMetricServicePushProcessingTime = jest.spyOn(
        metricService,
        'pushProcessingTime',
      );
      const client = createMock<WebSocket>();
      const data = [MessageType.REQ, 'test', {}];

      await nostrRelayService.handleMessage(client, data);
      expect(fakeRelayHandleMessage).toHaveBeenCalledWith(client, data);
      expect(fakeMetricServicePushProcessingTime).toHaveBeenCalledWith(
        MessageType.REQ,
        expect.any(Number),
      );
    });

    it('validation error', async () => {
      const error = new ValidationError('error');
      jest
        .spyOn(nostrRelayService['validator'], 'validateIncomingMessage')
        .mockRejectedValue(error);
      const fakeRelayHandleMessage = jest.spyOn(
        nostrRelayService['relay'],
        'handleMessage',
      );
      const fakeMetricServicePushProcessingTime = jest.spyOn(
        metricService,
        'pushProcessingTime',
      );
      const client = createMock<WebSocket>();
      const data = [];

      const result = await nostrRelayService.handleMessage(client, data);
      expect(result).toEqual([MessageType.NOTICE, error.message]);
      expect(fakeRelayHandleMessage).not.toHaveBeenCalled();
      expect(fakeMetricServicePushProcessingTime).not.toHaveBeenCalled();
    });

    it('normal error', async () => {
      const error = new Error('error');
      (nostrRelayService as any).messageHandlingConfig = { req: true };
      jest
        .spyOn(nostrRelayService['validator'], 'validateIncomingMessage')
        .mockImplementation(async (data) => data as IncomingReqMessage);
      jest
        .spyOn(nostrRelayService['relay'], 'handleMessage')
        .mockRejectedValue(error);
      const fakeMetricServicePushProcessingTime = jest.spyOn(
        metricService,
        'pushProcessingTime',
      );
      const client = createMock<WebSocket>();
      const data = [MessageType.REQ, 'test', {}];

      const result = await nostrRelayService.handleMessage(client, data);
      expect(result).toEqual([MessageType.NOTICE, error.message]);
      expect(fakeMetricServicePushProcessingTime).not.toHaveBeenCalled();
    });

    it('should return directly if message type is not enabled', async () => {
      (nostrRelayService as any).messageHandlingConfig = { req: false };
      jest
        .spyOn(nostrRelayService['validator'], 'validateIncomingMessage')
        .mockImplementation(async (data) => data as IncomingReqMessage);
      const fakeRelayHandleMessage = jest.spyOn(
        nostrRelayService['relay'],
        'handleMessage',
      );
      const fakeMetricServicePushProcessingTime = jest.spyOn(
        metricService,
        'pushProcessingTime',
      );
      const client = createMock<WebSocket>();
      const data = [MessageType.REQ, 'test', {}];

      await nostrRelayService.handleMessage(client, data);
      expect(fakeRelayHandleMessage).not.toHaveBeenCalled();
      expect(fakeMetricServicePushProcessingTime).not.toHaveBeenCalled();
    });
  });

  describe('handleEvent', () => {
    it('should handle event', async () => {
      const event = createMock<Event>();
      const result = { success: true, message: 'message' };
      const fakeRelayHandleEvent = jest
        .spyOn(nostrRelayService['relay'], 'handleEvent')
        .mockResolvedValue(result);

      expect(await nostrRelayService.handleEvent(event)).toStrictEqual(result);
      expect(fakeRelayHandleEvent).toHaveBeenCalledWith(event);
    });
  });

  describe('findEvents', () => {
    it('should find events', async () => {
      const filters = [{}];
      const result = [];
      const fakeRelayFindEvents = jest
        .spyOn(nostrRelayService['relay'], 'findEvents')
        .mockResolvedValue(result);

      expect(await nostrRelayService.findEvents(filters)).toStrictEqual(result);
      expect(fakeRelayFindEvents).toHaveBeenCalledWith(filters, undefined);
    });
  });

  describe('validateEvent', () => {
    it('should validate event', async () => {
      const data = { id: 'test' };
      const result = { id: 'test' } as Event;
      const fakeValidatorValidateEvent = jest
        .spyOn(nostrRelayService['validator'], 'validateEvent')
        .mockResolvedValue(result);

      expect(await nostrRelayService.validateEvent(data)).toStrictEqual(result);
      expect(fakeValidatorValidateEvent).toHaveBeenCalledWith(data);
    });
  });

  describe('validateFilter', () => {
    it('should validate filter', async () => {
      const data = { ids: ['test'] };
      const result = { ids: ['test'] };
      const fakeValidatorValidateFilter = jest
        .spyOn(nostrRelayService['validator'], 'validateFilter')
        .mockResolvedValue(result);

      expect(await nostrRelayService.validateFilter(data)).toStrictEqual(
        result,
      );
      expect(fakeValidatorValidateFilter).toHaveBeenCalledWith(data);
    });
  });

  describe('validateFilters', () => {
    it('should validate filters', async () => {
      const data = [{ ids: ['test'] }];
      const result = [{ ids: ['test'] }];
      const fakeValidatorValidateFilters = jest
        .spyOn(nostrRelayService['validator'], 'validateFilters')
        .mockResolvedValue(result);

      expect(await nostrRelayService.validateFilters(data)).toStrictEqual(
        result,
      );
      expect(fakeValidatorValidateFilters).toHaveBeenCalledWith(data);
    });
  });
});
