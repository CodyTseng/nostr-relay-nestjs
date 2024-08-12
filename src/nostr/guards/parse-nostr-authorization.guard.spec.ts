import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createEvent } from '../../../test-utils/event';
import { ParseNostrAuthorizationGuard } from './parse-nostr-authorization.guard';

describe('ParseNostrAuthorizationGuard', () => {
  let guard: ParseNostrAuthorizationGuard;

  beforeEach(() => {
    guard = new ParseNostrAuthorizationGuard(
      createMock<ConfigService>({
        get: jest.fn(() => 'localhost'),
      }),
    );
  });

  it('should directly return true if hostname is not set', async () => {
    (guard as any).hostname = undefined;
    const { request, context } = createMockContext();
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.pubkey).toBeUndefined();
  });

  it('should directly return true if authorization header is not set', async () => {
    const { request, context } = createMockContext();
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.pubkey).toBeUndefined();
  });

  it('should directly return true if authorization type is not Nostr', async () => {
    const { request, context } = createMockContext({
      authorization: 'Bearer token',
    });
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.pubkey).toBeUndefined();
  });

  it('should directly return true if token is invalid', async () => {
    const authorization = 'Nostr invalid';
    const { request, context } = createMockContext({
      authorization,
    });
    expect(await guard.canActivate(context)).toBe(true);
    expect(request.pubkey).toBeUndefined();
  });

  it('should directly return true if token is expired', async () => {
    const event = createEvent({
      kind: 27235,
      tags: [['u', 'http://localhost']],
      created_at: Math.floor(Date.now() / 1000) - 61, // 1 minute ago
    });
    const token = Buffer.from(JSON.stringify(event)).toString('base64');
    const authorization = 'Nostr ' + token;
    const { request, context } = createMockContext({
      authorization,
    });

    expect(await guard.canActivate(context)).toBe(true);
    expect(request.pubkey).toBeUndefined();
  });

  it('should directly return true if event kind is not 27235', async () => {
    const event = createEvent({
      kind: 1,
      tags: [['u', 'http://localhost']],
    });
    const token = Buffer.from(JSON.stringify(event)).toString('base64');
    const authorization = 'Nostr ' + token;
    const { request, context } = createMockContext({
      authorization,
    });

    expect(await guard.canActivate(context)).toBe(true);
    expect(request.pubkey).toBeUndefined();
  });

  it('should directly return true if u tag is not set', async () => {
    const event = createEvent({
      kind: 27235,
    });
    const token = Buffer.from(JSON.stringify(event)).toString('base64');
    const authorization = 'Nostr ' + token;
    const { request, context } = createMockContext({
      authorization,
    });

    expect(await guard.canActivate(context)).toBe(true);
    expect(request.pubkey).toBeUndefined();
  });

  it('should directly return true if u tag value is not the same as hostname', async () => {
    const event = createEvent({
      kind: 1,
      tags: [['u', 'http://test.com']],
    });
    const token = Buffer.from(JSON.stringify(event)).toString('base64');
    const authorization = 'Nostr ' + token;
    const { request, context } = createMockContext({
      authorization,
    });

    expect(await guard.canActivate(context)).toBe(true);
    expect(request.pubkey).toBeUndefined();
  });

  it('should parse pubkey sucessfully', async () => {
    const event = createEvent({
      kind: 27235,
      tags: [['u', 'http://localhost']],
    });
    const token = Buffer.from(JSON.stringify(event)).toString('base64');
    const authorization = 'Nostr ' + token;
    const { request, context } = createMockContext({
      authorization,
    });

    expect(await guard.canActivate(context)).toBe(true);
    expect(request.pubkey).toBe(event.pubkey);
  });
});

function createMockContext(headers: Record<string, string> = {}) {
  const request: { headers: Record<string, string>; pubkey?: string } = {
    headers,
  };
  const context = createMock<ExecutionContext>({
    getClass: jest.fn().mockReturnValue({ name: 'Test' }),
    getHandler: jest.fn().mockReturnValue({ name: 'test' }),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
    }),
  });
  return { context, request };
}
