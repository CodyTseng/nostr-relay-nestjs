import { createMock } from '@golevelup/ts-jest';
import { Request, Response } from 'express';
import { NostrController } from './nostr.controller';

describe('NostrController', () => {
  describe('/', () => {
    let mockRes: Response;
    let responseData: any;

    beforeEach(() => {
      jest.clearAllMocks();
      mockRes = createMock<Response>({
        setHeader: () => mockRes,
        status: () => mockRes,
        send: (data) => (responseData = data),
      });
    });

    afterEach(() => {
      responseData = undefined;
    });

    it('should return relay information document', () => {
      const nostrController = new NostrController({
        get: (key: string) =>
          key === 'relayInfo' ? { name: 'nostr-relay-nestjs' } : {},
      } as any);
      const mockReq = createMock<Request>({
        headers: { accept: 'application/nostr+json' },
      });
      nostrController.root(mockReq, mockRes);
      expect(responseData.name).toBe('nostr-relay-nestjs');
      expect(responseData.supported_nips.includes(50)).toBe(false);

      const nostrControllerWithMeiliSearch = new NostrController({
        get: (key: string) =>
          key === 'meiliSearch' ? { apiKey: 'apiKey', host: 'host' } : {},
      } as any);
      nostrControllerWithMeiliSearch.root(mockReq, mockRes);
      expect(responseData.supported_nips.includes(50)).toBe(true);
    });

    it('should return a message tell users to connect with client', () => {
      const nostrController = new NostrController({
        get: () => ({}),
      } as any);
      const mockReq = createMock<Request>();

      nostrController.root(mockReq, mockRes);

      expect(responseData).toEqual(expect.any(String));
    });
  });
});
