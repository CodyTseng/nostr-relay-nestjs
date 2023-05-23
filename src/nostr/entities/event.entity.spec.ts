import {
  createEncryptedDirectMessageEventMock,
  DELEGATION_CREATED_AT_LESS_EVENT,
  DELEGATION_CREATED_AT_MORE_EVENT,
  DELEGATION_EVENT_DTO,
  DELEGATION_KIND_ERROR_EVENT,
  DELEGATION_MISSING_INFO_EVENT,
  DELEGATION_MISSING_OPERATOR_EVENT,
  DELEGATION_NAN_CONDITION_VALUE_EVENT,
  DELEGATION_WRONG_SIG_EVENT,
  EXPIRED_EVENT,
  FUTURE_REGULAR_EVENT,
  LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT,
  LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT,
  LEADING_8_ZERO_BITS_REGULAR_EVENT,
  NON_EXPIRED_EVENT,
  REGULAR_EVENT,
  REGULAR_EVENT_DTO,
} from '../../../seeds';
import { MAX_TIMESTAMP } from '../constants';
import { Event } from './event.entity';

describe('Event entity', () => {
  describe('validate', () => {
    it('should return undefined', async () => {
      expect(await NON_EXPIRED_EVENT.validate()).toBeUndefined();

      const delegationEvent = Event.fromEventDto(DELEGATION_EVENT_DTO);
      expect(await delegationEvent.validate()).toBeUndefined();
      expect(delegationEvent.delegator).toBe(
        'a734cca70ca3c08511e3c2d5a80827182e2804401fb28013a8f79da4dd6465ac',
      );
    });

    it('should return event id is wrong', async () => {
      const event = Event.fromEventDto({ ...REGULAR_EVENT_DTO, id: 'fake-id' });
      expect(await event.validate()).toBe('invalid: id is wrong');
    });

    it('should return signature is wrong', async () => {
      const event = Event.fromEventDto({
        ...REGULAR_EVENT_DTO,
        sig: 'fake-sig',
      });
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

    it('should return delegation tag verification failed', async () => {
      expect(await DELEGATION_KIND_ERROR_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
      expect(await DELEGATION_CREATED_AT_LESS_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
      expect(await DELEGATION_CREATED_AT_MORE_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );

      expect(await DELEGATION_MISSING_INFO_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
      expect(await DELEGATION_WRONG_SIG_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
      expect(await DELEGATION_MISSING_OPERATOR_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
      expect(await DELEGATION_NAN_CONDITION_VALUE_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
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

  describe('checkPermission', () => {
    it('should return true when pubkey is the sender or receiver of the encrypted DM event', async () => {
      const receiver =
        'a734cca70ca3c08511e3c2d5a80827182e2804401fb28013a8f79da4dd6465ac';
      const event = await createEncryptedDirectMessageEventMock({
        to: receiver,
      });

      expect(event.checkPermission(event.pubkey)).toBeTruthy();
      expect(event.checkPermission(receiver)).toBeTruthy();
    });

    it('should return true if it is not encrypted DM event', () => {
      expect(REGULAR_EVENT.checkPermission()).toBeTruthy();
    });

    it('should return false when pubkey is undefined', async () => {
      expect(
        (await createEncryptedDirectMessageEventMock()).checkPermission(),
      ).toBeFalsy();
    });

    it('should return false when the encrypted DM event has no receiver pubkey', async () => {
      const event = await createEncryptedDirectMessageEventMock({
        to: undefined,
      });
      expect(event.checkPermission('fake-pubkey')).toBeFalsy();

      (event as any).tags = [];
      expect(event.checkPermission('fake-pubkey')).toBeFalsy();
    });
  });
});
