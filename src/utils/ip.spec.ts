import { getIpFromReq } from './ip';

describe('ip', () => {
  describe('getIpFromRequest', () => {
    it('should return the ip address from x-forwarded-for header', () => {
      expect(
        getIpFromReq({
          headers: {
            'x-forwarded-for': '::1',
          },
        } as any),
      ).toBe('::1');

      expect(
        getIpFromReq({
          headers: {
            'x-forwarded-for': '::1, ::2',
          },
        } as any),
      ).toBe('::1');

      expect(
        getIpFromReq({
          headers: {
            'x-forwarded-for': ['::1', '::2'],
          },
        } as any),
      ).toBe('::1');
    });

    it('should return the ip address from remote address', () => {
      expect(
        getIpFromReq({
          headers: {},
          socket: {
            remoteAddress: '::1',
          },
        } as any),
      ).toBe('::1');
    });
  });
});
