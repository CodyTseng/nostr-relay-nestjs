import { createMock } from '@golevelup/ts-jest';
import { ArgumentsHost } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { createNoticeResponse } from '../../nostr/utils';
import { ClientException } from '../exceptions';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let globalExceptionFilter: GlobalExceptionFilter;

  const loggerErrorMock = jest.fn();

  beforeEach(() => {
    loggerErrorMock.mockReset();
    globalExceptionFilter = new GlobalExceptionFilter(
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

    globalExceptionFilter.catch(error, host);

    expect(mockClientSend).toBeCalledWith(
      JSON.stringify(createNoticeResponse(errMsg)),
    );
  });

  it('should not log when catch ClientException', () => {
    const host = createMock<ArgumentsHost>({
      getType: () => 'ws',
      switchToWs: () => ({
        getClient: () => createMock<WebSocket>(),
      }),
    });
    const error = new ClientException('test');

    globalExceptionFilter.catch(error, host);

    expect(loggerErrorMock).not.toBeCalled();
  });

  it('should return error msg when catch error in http', () => {
    const errMsg = 'test';
    const error = new Error(errMsg);

    const mockClientSend = jest.fn();
    const host = createMock<ArgumentsHost>({
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => ({
          status: () => ({
            send: mockClientSend,
          }),
        }),
      }),
    });

    globalExceptionFilter.catch(error, host);

    expect(mockClientSend).toBeCalledWith(`Internal Server Error: ${errMsg}`);
  });
});
