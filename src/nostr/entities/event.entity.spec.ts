import {
  EXPIRED_EVENT,
  FUTURE_REGULAR_EVENT,
  LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT,
  LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT,
  LEADING_8_ZERO_BITS_REGULAR_EVENT,
  NON_EXPIRED_EVENT,
  REGULAR_EVENT,
} from '../../../seeds';
import { MAX_TIMESTAMP } from '../constants';
import { Event } from './event.entity';

describe('Event entity', () => {
  describe('isEventValid', () => {
    it('should return undefined', async () => {
      expect(await NON_EXPIRED_EVENT.validate()).toBeUndefined();
    });

    it('should return event id is wrong', async () => {
      const event = Event.fromEventDto({ ...REGULAR_EVENT, id: 'fake-id' });
      expect(await event.validate()).toBe('invalid: id is wrong');
    });

    it('should return signature is wrong', async () => {
      const event = Event.fromEventDto({ ...REGULAR_EVENT, sig: 'fake-sig' });
      expect(await event.validate()).toBe('invalid: signature is wrong');
    });

    it('should return invalid created_at', async () => {
      expect(
        await FUTURE_REGULAR_EVENT.validate({ createdAtUpperLimit: 60 }),
      ).toBe(
        'invalid: created_at must not be later than 60 seconds from the current time',
      );
    });

    it('should handle successfully when event pow is enough', async () => {
      expect(
        await LEADING_8_ZERO_BITS_REGULAR_EVENT.validate({
          eventIdMinLeadingZeroBits: 8,
        }),
      ).toBeUndefined();

      expect(
        await LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT.validate({
          eventIdMinLeadingZeroBits: 4,
        }),
      ).toBeUndefined();
    });

    it('should return pow is less', async () => {
      expect(
        await LEADING_8_ZERO_BITS_REGULAR_EVENT.validate({
          eventIdMinLeadingZeroBits: 16,
        }),
      ).toBe('pow: difficulty 8 is less than 16');

      expect(
        await LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT.validate({
          eventIdMinLeadingZeroBits: 16,
        }),
      ).toBe('pow: difficulty 8 is less than 16');
    });

    it('should return event is expired', async () => {
      expect(await EXPIRED_EVENT.validate()).toBe('reject: event is expired');
    });
  });

  describe('extractDTagValueFromEvent', () => {
    it('should return dTagValue', () => {
      expect(
        Event.extractDTagValueFromEvent({ tags: [['d', 'dTagValue']] }),
      ).toBe('dTagValue');
    });

    it('should return empty string when dTag not found', () => {
      expect(Event.extractDTagValueFromEvent({ tags: [] })).toBe('');
    });
  });

  describe('extractExpirationTimestamp', () => {
    it('should return expiration timestamp', () => {
      expect(
        Event.extractExpirationTimestamp({
          tags: [['expiration', '1681224755']],
        }),
      ).toBe(1681224755);
    });

    it('should return MAX_TIMESTAMP', () => {
      expect(Event.extractExpirationTimestamp({ tags: [] })).toBe(
        MAX_TIMESTAMP,
      );

      expect(Event.extractExpirationTimestamp({ tags: [['expiration']] })).toBe(
        MAX_TIMESTAMP,
      );
    });
  });
});
