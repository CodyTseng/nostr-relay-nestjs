import { createMock } from '@golevelup/ts-jest';
import { MessageMappingProperties } from '@nestjs/websockets';
import { MessageEvent } from 'ws';
import { NostrWsAdapter } from './nostr-ws.adapter';
import { INestApplication } from '@nestjs/common';
import { MessageType } from '@nostr-relay/common';

describe('NostrWsAdapter', () => {
  const handler: MessageMappingProperties = {
    message: 'default',
    methodName: 'test',
    callback: jest.fn(),
  };
  const mockTransForm = jest.fn();
  let nostrWsAdapter: NostrWsAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    nostrWsAdapter = new NostrWsAdapter();
  });

  it('should handle message successfully', () => {
    const message = ['CLOSE', 'test'];
    nostrWsAdapter.bindMessageHandler(
      { data: Buffer.from(JSON.stringify(message)) } as MessageEvent,
      [handler],
      mockTransForm,
    );
    expect(mockTransForm).toHaveBeenCalled();
    expect(handler.callback).toHaveBeenCalledWith(message);
  });

  it('should return message must be a JSON array notice and must have at least one element', () => {
    nostrWsAdapter.bindMessageHandler(
      { data: Buffer.from(JSON.stringify({ test: 'test' })) } as MessageEvent,
      [handler],
      mockTransForm,
    );
    expect(mockTransForm).toHaveBeenCalledWith([
      MessageType.NOTICE,
      'invalid: message must be a JSON array and must have at least one element',
    ]);

    nostrWsAdapter.bindMessageHandler(
      { data: Buffer.from(JSON.stringify([])) } as MessageEvent,
      [handler],
      mockTransForm,
    );
    expect(mockTransForm).toHaveBeenCalledWith([
      MessageType.NOTICE,
      'invalid: message must be a JSON array and must have at least one element',
    ]);
  });

  it('should return EMPTY when message handler is not found', () => {
    nostrWsAdapter.bindMessageHandler(
      { data: Buffer.from(JSON.stringify(['CLOSE', 'test'])) } as MessageEvent,
      [],
      mockTransForm,
    );
    expect(mockTransForm).not.toHaveBeenCalled();
  });

  it('should return JSON error notice', () => {
    nostrWsAdapter.bindMessageHandler(
      { data: Buffer.from('t') } as MessageEvent,
      [handler],
      mockTransForm,
    );
    expect(mockTransForm).toHaveBeenCalledWith([
      MessageType.NOTICE,
      'error: Unexpected end of JSON input',
    ]);
  });
});
