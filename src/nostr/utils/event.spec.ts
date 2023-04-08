import {
  FUTURE_REGULAR_EVENT,
  LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT,
  LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT,
  LEADING_8_ZERO_BITS_REGULAR_EVENT,
  REGULAR_EVENT,
} from '../../../seeds';
import { extractDTagValueFromEvent, isEventValid } from './event';

describe('event', () => {
  describe('isEventValid', () => {
    it('should return event id is wrong', async () => {
      expect(await isEventValid({ ...REGULAR_EVENT, id: 'fake-id' })).toBe(
        'invalid: id is wrong',
      );
    });

    it('should return signature is wrong', async () => {
      expect(await isEventValid({ ...REGULAR_EVENT, sig: 'fake-sig' })).toBe(
        'invalid: signature is wrong',
      );
    });

    it('should return invalid created_at', async () => {
      expect(
        await isEventValid(FUTURE_REGULAR_EVENT, { createdAtUpperLimit: 60 }),
      ).toBe(
        'invalid: created_at must not be later than 60 seconds from the current time',
      );
    });

    it('should handle successfully when event pow is enough', async () => {
      expect(
        await isEventValid(LEADING_8_ZERO_BITS_REGULAR_EVENT, {
          eventIdMinLeadingZeroBits: 8,
        }),
      ).toBeUndefined();

      expect(
        await isEventValid(
          LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT,
          { eventIdMinLeadingZeroBits: 4 },
        ),
      ).toBeUndefined();
    });

    it('should return pow is less', async () => {
      expect(
        await isEventValid(LEADING_8_ZERO_BITS_REGULAR_EVENT, {
          eventIdMinLeadingZeroBits: 16,
        }),
      ).toBe('pow: difficulty 8 is less than 16');

      expect(
        await isEventValid(LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT, {
          eventIdMinLeadingZeroBits: 16,
        }),
      ).toBe('pow: difficulty 8 is less than 16');
    });
  });

  describe('extractDTagValueFromEvent', () => {
    it('should return dTagValue', () => {
      expect(extractDTagValueFromEvent({ tags: [['d', 'dTagValue']] })).toBe(
        'dTagValue',
      );
    });

    it('should return empty string when dTag not found', () => {
      expect(extractDTagValueFromEvent({ tags: [] })).toBe('');
    });
  });
});
