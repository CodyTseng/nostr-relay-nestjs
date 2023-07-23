import { createMock } from '@golevelup/ts-jest';
import { ArgumentsHost } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ValidationError } from 'zod-validation-error';
import { WsExceptionFilter } from '.';
import { createNoticeResponse } from '../../nostr/utils';

describe('WsExceptionFilter', () => {
  let wsExceptionFilter: WsExceptionFilter;

  const loggerErrorMock = jest.fn();

  beforeEach(() => {
    loggerErrorMock.mockReset();
    wsExceptionFilter = new WsExceptionFilter(
      createMock<PinoLogger>({
        error: loggerErrorMock,
      }),
    );
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

  it('should not log when catch ValidationError', () => {
    const host = createMock<ArgumentsHost>({
      getType: () => 'ws',
      switchToWs: () => ({
        getClient: () => createMock<WebSocket>(),
      }),
    });
    const error = new ValidationError('test');

    wsExceptionFilter.catch(error, host);

    expect(loggerErrorMock).not.toBeCalled();
  });
});
