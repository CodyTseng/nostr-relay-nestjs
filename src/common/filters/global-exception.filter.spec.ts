import { createMock } from '@golevelup/ts-jest';
import { ArgumentsHost, HttpException } from '@nestjs/common';
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

      expect(mockClientSend).toBeCalledWith(
        JSON.stringify(createNoticeResponse(errMsg)),
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

      expect(mockStatus).toBeCalledWith(500);
      expect(mockSend).toBeCalledWith('Internal Server Error!');
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

      expect(mockStatus).toBeCalledWith(501);
      expect(mockSend).toBeCalledWith('Internal Server Error!');
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

      expect(mockStatus).toBeCalledWith(404);
      expect(mockSend).toBeCalledWith('test');
    });
  });

  it('rpc or others', () => {
    const error = new Error('test');

    const host = createMock<ArgumentsHost>({
      getType: () => 'rpc',
    });

    globalExceptionFilter.catch(error, host);

    expect(loggerErrorMock).toBeCalledWith(error);
  });
});
