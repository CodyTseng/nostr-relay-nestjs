import { createMock } from '@golevelup/ts-jest';
import { MessageMappingProperties } from '@nestjs/websockets';
import { MessageEvent } from 'ws';
import { NostrWsAdapter } from './nostr-ws.adapter';
import { createNoticeResponse } from './utils';
import { INestApplication } from '@nestjs/common';

describe('NostrWsAdapter', () => {
  const EVENT_TYPE = 'EVENT';
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
    nostrWsAdapter = new NostrWsAdapter(
      createMock<INestApplication>({
        get: jest.fn().mockReturnValue({
          get: jest.fn().mockReturnValue({
            event: true,
          }),
        }),
      }),
    );
  });

  it('should handle message successfully', () => {
    const DATA = 'hello';
    testBindMessageHandler(JSON.stringify([EVENT_TYPE, DATA]), [
      EVENT_TYPE,
      DATA,
    ]);
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

  it('should return empty when message type is disabled', () => {
    nostrWsAdapter = new NostrWsAdapter(
      createMock<INestApplication>({
        get: jest.fn().mockReturnValue({
          get: jest.fn().mockReturnValue({
            event: false,
          }),
        }),
      }),
    );

    nostrWsAdapter.bindMessageHandler(
      createMock<MessageEvent>({ data: JSON.stringify([EVENT_TYPE, 'hello']) }),
      handlers,
      mockTransForm,
    );

    expect(mockTransForm).not.toHaveBeenCalled();
  });

  function testBindMessageHandler(data: any, response: any) {
    nostrWsAdapter.bindMessageHandler(
      createMock<MessageEvent>({ data }),
      handlers,
      mockTransForm,
    );

    expect(mockTransForm).toHaveBeenCalledWith(response);
  }
});
