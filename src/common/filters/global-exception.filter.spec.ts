import { createMock } from '@golevelup/ts-jest';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { createOutgoingNoticeMessage } from '@nostr-relay/common';
import { PinoLogger } from 'nestjs-pino';
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

  describe('ws', () => {
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

      expect(mockClientSend).toHaveBeenCalledWith(
        JSON.stringify(createOutgoingNoticeMessage(errMsg)),
      );
    });
  });

  describe('http', () => {
    it('should return ISE when catch a normal error', () => {
      const error = new Error('test');

      const mockSend = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend,
      });
      const host = createMock<ArgumentsHost>({
        getType: () => 'http',
        switchToHttp: () => ({
          getResponse: () => ({
            status: mockStatus,
          }),
        }),
      });

      globalExceptionFilter.catch(error, host);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith({
        message: 'Internal Server Error!',
        error: 'Internal Error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should return ISE when catch a 5xx http exception', () => {
      const error = new HttpException('test', 501);

      const mockSend = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend,
      });
      const host = createMock<ArgumentsHost>({
        getType: () => 'http',
        switchToHttp: () => ({
          getResponse: () => ({
            status: mockStatus,
          }),
        }),
      });

      globalExceptionFilter.catch(error, host);

      expect(mockStatus).toHaveBeenCalledWith(501);
      expect(mockSend).toHaveBeenCalledWith({
        message: 'Internal Server Error!',
        error: 'Internal Error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    });

    it('should return error msg when catch a 4xx http exception', () => {
      const error = new HttpException('test', 404);

      const mockSend = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({
        send: mockSend,
      });
      const host = createMock<ArgumentsHost>({
        getType: () => 'http',
        switchToHttp: () => ({
          getResponse: () => ({
            status: mockStatus,
          }),
        }),
      });

      globalExceptionFilter.catch(error, host);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockSend).toHaveBeenCalledWith(error.getResponse());
    });
  });

  it('rpc or others', () => {
    const error = new Error('test');

    const host = createMock<ArgumentsHost>({
      getType: () => 'rpc',
    });

    globalExceptionFilter.catch(error, host);

    expect(loggerErrorMock).toHaveBeenCalledWith(error);
  });
});
