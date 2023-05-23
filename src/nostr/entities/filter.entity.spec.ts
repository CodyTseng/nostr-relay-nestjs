import {
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
} from '../../../seeds/event';
import { EventKind } from '../constants';
import { Filter } from './filter.entity';

describe('filter', () => {
  describe('isEventMatchingFilter', () => {
    it('should return true', () => {
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
      expect(
        Filter.fromFilterDto({ dTagValues: ['test'] }).isEventMatching(
          PARAMETERIZED_REPLACEABLE_EVENT,
        ),
      ).toBeTruthy();
    });

    it('should return false', () => {
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
        Filter.fromFilterDto({ dTagValues: ['fake'] }).isEventMatching(
          REGULAR_EVENT,
        ),
      ).toBeFalsy();
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
});
