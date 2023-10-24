import { createMock } from '@golevelup/ts-jest';
import { PinoLogger } from 'nestjs-pino';
import { WebSocket, WebSocketServer } from 'ws';
import {
  createTestEncryptedDirectMessageEvent,
  REGULAR_EVENT,
} from '../../../seeds';
import { Filter } from '../entities';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    subscriptionService = new SubscriptionService(createMock<PinoLogger>());
  });

  it('should subscribe successfully', () => {
    const client = createMock<WebSocket>();
    const subscriptionIdA = 'testA';
    const filtersA = [{ kinds: [1] }].map(Filter.fromFilterDto);
    const subscriptionIdB = 'testB';
    const filtersB = [{ kinds: [2] }].map(Filter.fromFilterDto);

    subscriptionService.subscribe(client, subscriptionIdA, filtersA);
    subscriptionService.subscribe(client, subscriptionIdB, filtersB);

    expect(
      subscriptionService['subscriptionsMap'].get(client)?.get(subscriptionIdA),
    ).toEqual(filtersA);
    expect(
      subscriptionService['subscriptionsMap'].get(client)?.get(subscriptionIdB),
    ).toEqual(filtersB);
  });

  it('should unsubscribe successfully', () => {
    const client = createMock<WebSocket>();
    const subscriptionId = 'test';
    const filters = [{ kinds: [1] }].map(Filter.fromFilterDto);

    expect(subscriptionService.unSubscribe(client, subscriptionId)).toBeFalsy();

    subscriptionService.subscribe(client, subscriptionId, filters);

    expect(
      subscriptionService.unSubscribe(client, subscriptionId),
    ).toBeTruthy();
    expect(subscriptionService['subscriptionsMap'].has(client)).toBeTruthy();
    expect(
      subscriptionService['subscriptionsMap'].get(client)?.has(subscriptionId),
    ).toBeFalsy();
  });

  it('should clear successfully', () => {
    const client = createMock<WebSocket>();
    const subscriptionId = 'test';
    const filters = [{ kinds: [1] }].map(Filter.fromFilterDto);

    subscriptionService.subscribe(client, subscriptionId, filters);
    subscriptionService.clear(client);

    expect(subscriptionService['subscriptionsMap'].has(client)).toBeFalsy();
  });

  describe('broadcast', () => {
    it('should broadcast successfully', () => {
      const mockClientASend = jest.fn();
      const mockClientBSend = jest.fn();
      const clientA = createMock<WebSocket>({
        readyState: WebSocket.OPEN,
        send: mockClientASend,
      });
      const clientB = createMock<WebSocket>({
        readyState: WebSocket.OPEN,
        send: mockClientBSend,
      });
      const clientC = createMock<WebSocket>({
        readyState: WebSocket.OPEN,
      });
      const subscriptionId = 'test';
      const filters = [{ kinds: [1] }].map(Filter.fromFilterDto);

      subscriptionService.setServer(
        createMock<WebSocketServer>({
          clients: new Set([clientA, clientB, clientC]),
        }),
      );

      subscriptionService.subscribe(clientA, subscriptionId, filters);
      subscriptionService.subscribe(clientB, subscriptionId, filters);
      subscriptionService.broadcast(REGULAR_EVENT);

      expect(mockClientASend).toBeCalledTimes(1);
      expect(mockClientBSend).toBeCalledTimes(1);
    });

    it('should not send when the readyState of client is not OPEN', () => {
      const mockClientSend = jest.fn();
      const client = createMock<WebSocket>({
        readyState: WebSocket.CLOSED,
        send: mockClientSend,
      });
      const subscriptionId = 'test';
      const filters = [{ kinds: [1] }].map(Filter.fromFilterDto);

      subscriptionService.setServer(
        createMock<WebSocketServer>({ clients: new Set([client]) }),
      );
      subscriptionService.subscribe(client, subscriptionId, filters);
      subscriptionService.broadcast(REGULAR_EVENT);

      expect(mockClientSend).not.toBeCalled();
    });

    it('should not send when the event not match', () => {
      const mockClientSend = jest.fn();
      const client = createMock<WebSocket>({
        readyState: WebSocket.OPEN,
        send: mockClientSend,
      });
      const subscriptionId = 'test';
      const filters = [{ kinds: [2] }].map(Filter.fromFilterDto);

      subscriptionService.setServer(
        createMock<WebSocketServer>({ clients: new Set([client]) }),
      );
      subscriptionService.subscribe(client, subscriptionId, filters);
      subscriptionService.broadcast(REGULAR_EVENT);

      expect(mockClientSend).not.toBeCalled();
    });

    it('should log error when the WebSocketServer not found', () => {
      const mockErrorLog = jest.fn();
      (subscriptionService as any).logger = createMock<PinoLogger>({
        error: mockErrorLog,
      });

      subscriptionService.broadcast(REGULAR_EVENT);

      expect(mockErrorLog).toBeCalledWith(
        new Error('WebSocketServer not found'),
      );
    });

    it('should filter out unauthorized events', async () => {
      const mockClientSend = jest.fn();
      const client = createMock<WebSocket>({
        readyState: WebSocket.OPEN,
        send: mockClientSend,
      });
      const subscriptionId = 'test';
      const filters = [{ kinds: [4] }].map(Filter.fromFilterDto);

      subscriptionService.setServer(
        createMock<WebSocketServer>({ clients: new Set([client]) }),
      );
      subscriptionService.subscribe(client, subscriptionId, filters);
      subscriptionService.broadcast(createTestEncryptedDirectMessageEvent());

      expect(mockClientSend).not.toBeCalled();
    });
  });
});
