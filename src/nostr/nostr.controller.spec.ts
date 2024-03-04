import { createMock } from '@golevelup/ts-jest';
import { Request, Response } from 'express';
import { NostrController } from './nostr.controller';
import { MetricService } from './services/metric.service';

describe('NostrController', () => {
  const metricService = createMock<MetricService>({
    getMetrics: () => ({ test: 'test' }) as any,
  });

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
      const nostrController = new NostrController(metricService, {
        get: (key: string) =>
          key === 'relayInfo' ? { name: 'nostr-relay-nestjs' } : {},
      } as any);
      const mockReq = createMock<Request>({
        headers: { accept: 'application/nostr+json' },
      });
      nostrController.root(mockReq, mockRes);
      expect(responseData.name).toBe('nostr-relay-nestjs');
      expect(responseData.supported_nips.includes(50)).toBe(false);

      const nostrControllerWithMeiliSearch = new NostrController(
        metricService,
        {
          get: (key: string) =>
            key === 'meiliSearch' ? { apiKey: 'apiKey', host: 'host' } : {},
        } as any,
      );
      nostrControllerWithMeiliSearch.root(mockReq, mockRes);
      expect(responseData.supported_nips.includes(50)).toBe(true);
    });

    it('should return a message tell users to connect with client', () => {
      const nostrController = new NostrController(metricService, {
        get: () => ({}),
      } as any);
      const mockReq = createMock<Request>();

      nostrController.root(mockReq, mockRes);

      expect(responseData).toEqual(expect.any(String));
    });
  });

  describe('/.well-known/nostr.json', () => {
    it('should return admin pubkey', async () => {
      const nostrController = new NostrController(metricService, {
        get: () => ({}),
      } as any);
      const pubkey =
        'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7';
      (nostrController as any).relayInfoDoc = { pubkey };

      expect(await nostrController.nip05('_')).toEqual({
        names: { _: pubkey },
      });
      expect(await nostrController.nip05('non-admin')).toEqual({});
    });

    it('should return empty JSON object when no pubkey is configured', async () => {
      const nostrController = new NostrController(metricService, {
        get: () => ({}),
      } as any);
      expect(await nostrController.nip05('_')).toEqual({});
    });
  });

  describe('/metrics', () => {
    it('should return metrics', () => {
      const nostrController = new NostrController(metricService, {
        get: () => ({}),
      } as any);

      expect(nostrController.metrics()).toEqual({ test: 'test' });
    });
  });
});
