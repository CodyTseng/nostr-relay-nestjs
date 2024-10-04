import { ListNip05Schema } from './list-nip-05.schema';

describe('ListNip05Schema', () => {
  it('should return limit and after', () => {
    expect(ListNip05Schema.parse({ limit: '10', after: 'name' })).toEqual({
      limit: 10,
      after: 'name',
    });
  });
});
