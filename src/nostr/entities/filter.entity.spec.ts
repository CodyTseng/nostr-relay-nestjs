import {
  createTestEventDto,
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
} from '../../../seeds/event';
import { EventKind } from '../constants';
import { Event } from './event.entity';
import { Filter } from './filter.entity';

describe('filter', () => {
  describe('isEventMatchingFilter', () => {
    it('should return true', async () => {
      expect(
        Filter.fromFilterDto({ ids: [REGULAR_EVENT.id] }).isEventMatching(
          REGULAR_EVENT,
        ),
      ).toBeTruthy();
      expect(
        Filter.fromFilterDto({
          tags: {
            p: [
              '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
            ],
          },
        }).isEventMatching(PARAMETERIZED_REPLACEABLE_EVENT),
      ).toBeTruthy();

      const unStandardTagEvent = createTestEventDto({
        tags: [['z', 'test1']],
      });
      expect(
        Filter.fromFilterDto({
          tags: {
            z: ['test1', 'test2'],
          },
        }).isEventMatching(Event.fromEventDto(unStandardTagEvent)),
      ).toBeTruthy();

      expect(
        Filter.fromFilterDto({ search: 'test' }).isEventMatching(
          Event.fromEventDto(createTestEventDto({ content: 'abandon test' })),
        ),
      ).toBeTruthy();
    });

    it('should return false', async () => {
      expect(
        Filter.fromFilterDto({ ids: ['fake-id'] }).isEventMatching(
          REGULAR_EVENT,
        ),
      ).toBeFalsy();
      expect(
        Filter.fromFilterDto({ authors: ['fake-author'] }).isEventMatching(
          REGULAR_EVENT,
        ),
      ).toBeFalsy();
      expect(
        Filter.fromFilterDto({ kinds: [2] }).isEventMatching(REGULAR_EVENT),
      ).toBeFalsy();
      expect(
        Filter.fromFilterDto({
          since: REGULAR_EVENT.createdAt + 1,
        }).isEventMatching(REGULAR_EVENT),
      ).toBeFalsy();
      expect(
        Filter.fromFilterDto({
          until: REGULAR_EVENT.createdAt - 1,
        }).isEventMatching(REGULAR_EVENT),
      ).toBeFalsy();
      expect(
        Filter.fromFilterDto({ tags: { p: ['fake'] } }).isEventMatching(
          PARAMETERIZED_REPLACEABLE_EVENT,
        ),
      ).toBeFalsy();
      expect(
        Filter.fromFilterDto({ search: 'test' }).isEventMatching(
          Event.fromEventDto(createTestEventDto({ content: 'abandon' })),
        ),
      ).toBeFalsy();
    });
  });

  describe('fromFilterDto', () => {
    it('should create filter successfully', () => {
      const filter = Filter.fromFilterDto({
        search: 'test1 test2 test3:test4 test5:test6',
        tags: { a: ['test1', 'test2'], b: ['test3', 'test4'], d: ['test5'] },
      });

      expect(filter.search).toEqual('test1 test2');
      expect(filter.searchOptions).toEqual({
        test3: 'test4',
        test5: 'test6',
      });
      expect(filter.genericTagsCollection).toEqual([
        ['a:test1', 'a:test2'],
        ['b:test3', 'b:test4'],
        ['d:test5'],
      ]);

      expect(
        Filter.fromFilterDto({
          kinds: [EventKind.PARAMETERIZED_REPLACEABLE_FIRST],
          authors: ['test'],
          tags: { d: ['test'] },
        }).dTagValues,
      ).toEqual(['test']);

      expect(
        Filter.fromFilterDto({
          kinds: [
            EventKind.TEXT_NOTE,
            EventKind.PARAMETERIZED_REPLACEABLE_FIRST,
          ],
          authors: ['test'],
          tags: { d: ['test'] },
        }).dTagValues,
      ).toBeUndefined();

      expect(
        Filter.fromFilterDto({
          authors: ['test'],
          tags: { d: ['test'] },
        }).dTagValues,
      ).toBeUndefined();

      expect(
        Filter.fromFilterDto({
          kinds: [EventKind.PARAMETERIZED_REPLACEABLE_FIRST],
          tags: { d: ['test'] },
        }).dTagValues,
      ).toBeUndefined();
    });
  });

  describe('hasEncryptedDirectMessageKind', () => {
    it('should return true', () => {
      expect(
        Filter.fromFilterDto({
          kinds: [EventKind.ENCRYPTED_DIRECT_MESSAGE],
        }).hasEncryptedDirectMessageKind(),
      ).toBeTruthy();
    });

    it('should return false', () => {
      expect(
        Filter.fromFilterDto({
          kinds: [EventKind.TEXT_NOTE],
        }).hasEncryptedDirectMessageKind(),
      ).toBeFalsy();
    });
  });

  describe('isSearchFilter', () => {
    it('should return true', () => {
      expect(
        Filter.fromFilterDto({ search: 'test' }).isSearchFilter(),
      ).toBeTruthy();
    });

    it('should return false', () => {
      expect(
        Filter.fromFilterDto({ ids: ['test'] }).isSearchFilter(),
      ).toBeFalsy();
    });
  });

  describe('parseSearch', () => {
    it('should return search and searchOptions', () => {
      expect(Filter.parseSearch('test')).toEqual({
        search: 'test',
        searchOptions: {},
      });
      expect(Filter.parseSearch('test1 test2')).toEqual({
        search: 'test1 test2',
        searchOptions: {},
      });
      expect(Filter.parseSearch('test1 test2 test3:test4')).toEqual({
        search: 'test1 test2',
        searchOptions: { test3: 'test4' },
      });
      expect(Filter.parseSearch('test1 test2 test3:test4 test5:test6')).toEqual(
        {
          search: 'test1 test2',
          searchOptions: { test3: 'test4', test5: 'test6' },
        },
      );
    });
  });
});
