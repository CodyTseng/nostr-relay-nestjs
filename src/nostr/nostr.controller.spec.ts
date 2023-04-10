import { createMock } from '@golevelup/ts-jest';
import { Request, Response } from 'express';
import { NostrController } from './nostr.controller';

describe('NostrController', () => {
  let nostrController: NostrController;

  beforeEach(() => {
    nostrController = new NostrController({ get: () => ({}) } as any);
  });

  describe('/', () => {
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
      const relayInfoDoc = {
        name: 'nostr-relay-nestjs',
      };
      (nostrController as any).relayInfoDoc = relayInfoDoc;
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

  describe('/.well-known/nostr.json', () => {
    it('should return admin pubkey', async () => {
      const pubkey =
        'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7';
      (nostrController as any).relayInfoDoc = { pubkey };

      expect(await nostrController.nip05('_')).toEqual({
        names: { _: pubkey },
      });
      expect(await nostrController.nip05('non-admin')).toEqual({});
    });

    it('should return empty JSON object when no pubkey is configured', async () => {
      expect(await nostrController.nip05('_')).toEqual({});
    });
  });
});
