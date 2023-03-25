import { createMock } from '@golevelup/ts-jest';
import { ConfigService } from '@nestjs/config';
import { NostrController } from './nostr.controller';
import { Request, Response } from 'express';

describe('NostrController', () => {
  const relayInfoDoc = {
    name: 'nostr-relay-nestjs',
  };
  const nostrController = new NostrController(
    createMock<ConfigService>({
      get: () => relayInfoDoc,
    }),
  );

  let mockSend: jest.Mock;
  let mockRes: Response;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSend = jest.fn();
    mockRes = createMock<Response>({
      setHeader: () => mockRes,
      status: () => mockRes,
      send: mockSend,
    });
  });

  it('should return relay information document', () => {
    const mockReq = createMock<Request>({
      headers: { accept: 'application/nostr+json' },
    });

    nostrController.root(mockReq, mockRes);

    expect(mockSend).toBeCalledWith(relayInfoDoc);
  });

  it('should return a message tell users to connect with client', () => {
    const mockReq = createMock<Request>();

    nostrController.root(mockReq, mockRes);

    expect(mockSend).toBeCalledWith(
      'Please use a Nostr client to connect. Powered by nostr-relay-nestjs.',
    );
  });
});
