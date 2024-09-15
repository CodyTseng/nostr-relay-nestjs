import { createWsAdapter } from './create-ws-adapter';

describe('createWsAdapter', () => {
  let messagePreprocessor: Function;

  beforeEach(() => {
    const adapter = createWsAdapter({} as any);
    messagePreprocessor = adapter['messagePreprocessor'];
  });

  it('event request', () => {
    const message = ['EVENT', { id: 'test' }];
    expect(messagePreprocessor(message)).toEqual({
      event: 'DEFAULT',
      data: message,
    });
  });

  it('req request', () => {
    const message = ['REQ', 'test', {}];
    expect(messagePreprocessor(message)).toEqual({
      event: 'DEFAULT',
      data: message,
    });
  });

  it('close request', () => {
    const message = ['CLOSE', 'test'];
    expect(messagePreprocessor(message)).toEqual({
      event: 'DEFAULT',
      data: message,
    });
  });

  it('auth request', () => {
    const message = ['AUTH', { id: 'test' }];
    expect(messagePreprocessor(message)).toEqual({
      event: 'DEFAULT',
      data: message,
    });
  });

  it('top request', () => {
    const message = ['TOP', 'test', {}];
    expect(messagePreprocessor(message)).toEqual({
      event: 'TOP',
      data: message,
    });
  });

  it('invalid request', () => {
    expect(messagePreprocessor('test')).toBeUndefined();
    expect(messagePreprocessor([])).toBeUndefined();
    expect(messagePreprocessor([1])).toBeUndefined();
    expect(messagePreprocessor(['TEST'])).toBeUndefined();
  });
});
