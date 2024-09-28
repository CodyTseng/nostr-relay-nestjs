import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { WebSocket } from 'ws';
import { ValidationError } from 'zod-validation-error';
import { EventService } from '../services/event.service';
import { NostrRelayService } from '../services/nostr-relay.service';
import { NostrGateway } from './nostr.gateway';

describe('NostrGateway', () => {
  let nostrGateway: NostrGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    nostrGateway = new NostrGateway(
      createMock<PinoLogger>(),
      createMock<EventService>(),
      createMock<NostrRelayService>(),
      createMock<ConfigService>(),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should call handleConnection', () => {
      const mockClient = {} as WebSocket;
      const mockRequest = createMock<Request>();
      const spy = jest
        .spyOn(nostrGateway['nostrRelayService'], 'handleConnection')
        .mockImplementation();
      nostrGateway.handleConnection(mockClient, mockRequest);
      expect(spy).toHaveBeenCalledWith(mockClient, mockRequest);
    });
  });

  describe('handleDisconnect', () => {
    it('should call handleDisconnect', () => {
      const mockClient = {} as WebSocket;
      const spy = jest
        .spyOn(nostrGateway['nostrRelayService'], 'handleDisconnect')
        .mockImplementation();
      nostrGateway.handleDisconnect(mockClient);
      expect(spy).toHaveBeenCalledWith(mockClient);
    });
  });

  describe('handleMessage', () => {
    it('should call handleMessage', async () => {
      const mockClient = {} as WebSocket;
      const mockData: any = ['event'];
      const nostrRelayHandleMessageSpy = jest
        .spyOn(nostrGateway['nostrRelayService'], 'handleMessage')
        .mockImplementation();
      await nostrGateway.handleMessage(mockClient, mockData);
      expect(nostrRelayHandleMessageSpy).toHaveBeenCalledWith(
        mockClient,
        mockData,
      );
    });
  });

  describe('top', () => {
    it('should handle TOP message', async () => {
      const mockData: any = ['TOP', 'test', {}];
      (nostrGateway as any).messageHandlingConfig = {
        top: true,
      };
      jest
        .spyOn(nostrGateway['nostrRelayService'], 'validateFilter')
        .mockResolvedValue({});
      const findTopIdsSpy = jest
        .spyOn(nostrGateway['eventService'], 'findTopIds')
        .mockResolvedValue(['test']);

      const result = await nostrGateway.top(mockData);
      expect(result).toEqual(['TOP', 'test', ['test']]);
      expect(findTopIdsSpy).toHaveBeenCalledWith([{}]);
    });

    it('should return directly if type is not enable', async () => {
      const mockData: any = ['TOP', 'test', {}];
      (nostrGateway as any).messageHandlingConfig = {
        top: false,
      };

      const result = await nostrGateway.top(mockData);
      expect(result).toBeUndefined();
    });

    it('should return directly if message length is less than 3', async () => {
      const mockData: any = ['TOP', 'test'];
      (nostrGateway as any).messageHandlingConfig = {
        top: true,
      };

      const result = await nostrGateway.top(mockData);
      expect(result).toBeUndefined();
    });

    it('should return notice if subscriptionId is invalid', async () => {
      const mockData: any = ['TOP', 123, {}];
      (nostrGateway as any).messageHandlingConfig = {
        top: true,
      };

      const result = await nostrGateway.top(mockData);
      expect(result).toEqual(['NOTICE', expect.any(String)]);
    });

    it('should return notice if filter is invalid', async () => {
      const mockData: any = ['TOP', 'test', 'test'];
      (nostrGateway as any).messageHandlingConfig = {
        top: true,
      };
      jest
        .spyOn(nostrGateway['nostrRelayService'], 'validateFilters')
        .mockRejectedValue(new ValidationError('test'));

      const result = await nostrGateway.top(mockData);
      expect(result).toEqual(['NOTICE', expect.any(String)]);
    });
  });
});
