import { createMock } from '@golevelup/ts-jest';
import { ArgumentsHost } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { WsExceptionFilter } from '.';
import { createNoticeResponse } from '../../nostr/utils';

describe('WsExceptionFilter', () => {
  let wsExceptionFilter: WsExceptionFilter;

  beforeEach(() => {
    wsExceptionFilter = new WsExceptionFilter(createMock<PinoLogger>());
  });

  it('should send notice response to client when catch error', () => {
    const errMsg = 'test';
    const error = new Error(errMsg);

    const mockClientSend = jest.fn();
    const host = createMock<ArgumentsHost>({
      getType: () => 'ws',
      switchToWs: () => ({
        getClient: () => createMock<WebSocket>({ send: mockClientSend }),
      }),
    });

    wsExceptionFilter.catch(error, host);

    expect(mockClientSend).toBeCalledWith(
      JSON.stringify(createNoticeResponse(errMsg)),
    );
  });
});
