import { FilterDtoSchema } from './filter-dto.schema';

describe('FilterSchema', () => {
  it('should parse successfully', () => {
    expect(
      FilterDtoSchema.parse({
        ids: [
          '1c7c87a5e52e6c4e94a6c018920f31f256db83f8560b26a493f059caaf730f56',
        ],
        authors: [
          '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
        ],
        '#p': [
          '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
        ],
        '#d': ['test'],
      }),
    ).toEqual({
      ids: ['1c7c87a5e52e6c4e94a6c018920f31f256db83f8560b26a493f059caaf730f56'],
      authors: [
        '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
      ],
      tags: {
        p: ['096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0'],
      },
      dTagValues: ['test'],
    });
  });

  it('should throw error', () => {
    expect(() => FilterDtoSchema.parse({ '#1': ['test'] })).toThrowError();
  });
});
