import { createMock } from '@golevelup/ts-jest';
import { MessageMappingProperties } from '@nestjs/websockets';
import { MessageEvent } from 'ws';
import { NostrWsAdapter } from './nostr-ws.adapter';
import { createNoticeResponse } from './utils';

describe('NostrWsAdapter', () => {
  const EVENT_TYPE = 'TEST';
  const handlers = [
    {
      message: EVENT_TYPE,
      callback: (data: unknown) => data,
    } as MessageMappingProperties,
  ];

  let mockTransForm: jest.Mock;
  let nostrWsAdapter: NostrWsAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransForm = jest.fn();
    nostrWsAdapter = new NostrWsAdapter();
  });

  it('should handle message successfully', () => {
    const DATA = 'hello';
    testBindMessageHandler(JSON.stringify([EVENT_TYPE, DATA]), [DATA]);
  });

  it('should return message must be a JSON array notice', () => {
    testBindMessageHandler(
      JSON.stringify('message'),
      createNoticeResponse('invalid: message must be a JSON array'),
    );
  });

  it('should return unknown message type notice', () => {
    testBindMessageHandler(
      JSON.stringify(['fake-event-type']),
      createNoticeResponse('invalid: unknown message type'),
    );
  });

  it('should return JSON error notice', () => {
    testBindMessageHandler(
      't',
      createNoticeResponse('error: Unexpected end of JSON input'),
    );
  });

  function testBindMessageHandler(data: any, response: any) {
    nostrWsAdapter.bindMessageHandler(
      createMock<MessageEvent>({ data }),
      handlers,
      mockTransForm,
    );

    expect(mockTransForm).toBeCalledWith(response);
  }
});
