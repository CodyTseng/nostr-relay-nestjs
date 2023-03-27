import {
  PARAMETERIZED_REPLACEABLE_EVENT,
  REGULAR_EVENT,
} from '../../../seeds/event';
import { isEventMatchingFilter, isGenericTagName } from './filter';

describe('filter', () => {
  describe('isGenericTagName', () => {
    it('should return true', () => {
      expect(isGenericTagName('#e')).toBeTruthy();
    });

    it('should return false', () => {
      expect(isGenericTagName('#ee')).toBeFalsy();
      expect(isGenericTagName('ee')).toBeFalsy();
    });
  });

  describe('isEventMatchingFilter', () => {
    it('should return true', () => {
      expect(
        isEventMatchingFilter(REGULAR_EVENT, { ids: [REGULAR_EVENT.id] }),
      ).toBeTruthy();
      expect(
        isEventMatchingFilter(PARAMETERIZED_REPLACEABLE_EVENT, {
          '#p': [
            '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0',
          ],
        }),
      ).toBeTruthy();
    });

    it('should return false', () => {
      expect(
        isEventMatchingFilter(REGULAR_EVENT, { ids: ['fake-id'] }),
      ).toBeFalsy();
      expect(
        isEventMatchingFilter(REGULAR_EVENT, { authors: ['fake-author'] }),
      ).toBeFalsy();
      expect(isEventMatchingFilter(REGULAR_EVENT, { kinds: [2] })).toBeFalsy();
      expect(
        isEventMatchingFilter(REGULAR_EVENT, {
          since: REGULAR_EVENT.created_at + 1,
        }),
      ).toBeFalsy();
      expect(
        isEventMatchingFilter(REGULAR_EVENT, {
          until: REGULAR_EVENT.created_at - 1,
        }),
      ).toBeFalsy();
      expect(
        isEventMatchingFilter(PARAMETERIZED_REPLACEABLE_EVENT, {
          '#p': ['fake'],
        }),
      ).toBeFalsy();
    });
  });
});
