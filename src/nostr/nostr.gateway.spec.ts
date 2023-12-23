import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { WebSocket } from 'ws';
import { NostrGateway } from './nostr.gateway';
import { PgEventRepository } from './repositories';

describe('NostrGateway', () => {
  let nostrGateway: NostrGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    const mockConfigService = createMock<ConfigService>();
    const mockEventRepository = createMock<PgEventRepository>();
    nostrGateway = new NostrGateway(mockConfigService, mockEventRepository);
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
});
