import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { WebSocket } from 'ws';
import { NostrGateway } from './nostr.gateway';
import { EventRepository } from './repositories';
import { EventService } from './services/event.service';

describe('NostrGateway', () => {
  let nostrGateway: NostrGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    nostrGateway = new NostrGateway(
      createMock<EventRepository>(),
      createMock<EventService>(),
      createMock<ConfigService>(),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should call handleConnection', () => {
      const mockClient = {} as WebSocket;
      const spy = jest
        .spyOn(nostrGateway['relay'], 'handleConnection')
        .mockImplementation();
      nostrGateway.handleConnection(mockClient);
      expect(spy).toHaveBeenCalledWith(mockClient);
    });
  });

  describe('handleDisconnect', () => {
    it('should call handleDisconnect', () => {
      const mockClient = {} as WebSocket;
      const spy = jest
        .spyOn(nostrGateway['relay'], 'handleDisconnect')
        .mockImplementation();
      nostrGateway.handleDisconnect(mockClient);
      expect(spy).toHaveBeenCalledWith(mockClient);
    });
  });

  describe('handleMessage', () => {
    it('should call handleMessage', async () => {
      const mockClient = {} as WebSocket;
      const mockData: any = ['event'];
      (nostrGateway as any).messageHandlingConfig = {
        event: true,
      };
      jest
        .spyOn(nostrGateway['validator'], 'validateIncomingMessage')
        .mockResolvedValue(mockData);
      const nostrRelayHandleMessageSpy = jest
        .spyOn(nostrGateway['relay'], 'handleMessage')
        .mockImplementation();
      await nostrGateway.handleMessage(mockClient, mockData);
      expect(nostrRelayHandleMessageSpy).toHaveBeenCalledWith(
        mockClient,
        mockData,
      );
    });

    it('should return directly if type is not enable', async () => {
      const mockClient = {} as WebSocket;
      const mockData: any = ['test'];
      (nostrGateway as any).messageHandlingConfig = {
        event: true,
      };
      jest
        .spyOn(nostrGateway['validator'], 'validateIncomingMessage')
        .mockResolvedValue(mockData);
      const nostrRelayHandleMessageSpy = jest
        .spyOn(nostrGateway['relay'], 'handleMessage')
        .mockImplementation();
      await nostrGateway.handleMessage(mockClient, mockData);
      expect(nostrRelayHandleMessageSpy).not.toHaveBeenCalled();
    });
  });

  describe('top', () => {
    it('should handle TOP message', async () => {
      const mockData: any = ['TOP', 'test', {}];
      (nostrGateway as any).messageHandlingConfig = {
        top: true,
      };
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

      const result = await nostrGateway.top(mockData);
      expect(result).toEqual(['NOTICE', expect.any(String)]);
    });
  });
});
