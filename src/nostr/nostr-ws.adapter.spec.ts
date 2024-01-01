import { MessageMappingProperties } from '@nestjs/websockets';
import { MessageType } from '@nostr-relay/common';
import { MessageEvent } from 'ws';
import { NostrWsAdapter } from './nostr-ws.adapter';

describe('NostrWsAdapter', () => {
  const defaultHandler: MessageMappingProperties = {
    message: 'DEFAULT',
    methodName: 'test',
    callback: jest.fn(),
  };
  const topHandler: MessageMappingProperties = {
    message: 'TOP',
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
      [defaultHandler, topHandler],
      mockTransForm,
    );
    expect(mockTransForm).toHaveBeenCalled();
    expect(defaultHandler.callback).toHaveBeenCalledWith(message);
  });

  it('should handle TOP event message successfully', () => {
    const message = ['TOP', 'test'];
    nostrWsAdapter.bindMessageHandler(
      { data: Buffer.from(JSON.stringify(message)) } as MessageEvent,
      [defaultHandler, topHandler],
      mockTransForm,
    );
    expect(mockTransForm).toHaveBeenCalled();
    expect(defaultHandler.callback).not.toHaveBeenCalled();
    expect(topHandler.callback).toHaveBeenCalledWith(message);
  });

  it('should return message must be a JSON array notice and must have at least one element', () => {
    nostrWsAdapter.bindMessageHandler(
      { data: Buffer.from(JSON.stringify({ test: 'test' })) } as MessageEvent,
      [defaultHandler],
      mockTransForm,
    );
    expect(mockTransForm).toHaveBeenCalledWith([
      MessageType.NOTICE,
      'invalid: message must be a JSON array and must have at least one element',
    ]);

    nostrWsAdapter.bindMessageHandler(
      { data: Buffer.from(JSON.stringify([])) } as MessageEvent,
      [defaultHandler],
      mockTransForm,
    );
    expect(mockTransForm).toHaveBeenCalledWith([
      MessageType.NOTICE,
      'invalid: message must be a JSON array and must have at least one element',
    ]);
  });

  it('should return EMPTY when message type is invalid', () => {
    nostrWsAdapter.bindMessageHandler(
      { data: Buffer.from(JSON.stringify(['test', 'test'])) } as MessageEvent,
      [defaultHandler],
      mockTransForm,
    );
    expect(mockTransForm).not.toHaveBeenCalled();

    nostrWsAdapter.bindMessageHandler(
      { data: Buffer.from(JSON.stringify([{}, 'test'])) } as MessageEvent,
      [defaultHandler],
      mockTransForm,
    );
    expect(mockTransForm).not.toHaveBeenCalled();
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
      [defaultHandler],
      mockTransForm,
    );
    expect(mockTransForm).toHaveBeenCalledWith([
      MessageType.NOTICE,
      'error: Unexpected end of JSON input',
    ]);
  });
});
