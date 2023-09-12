import { randomUUID } from 'crypto';
import {
  createEncryptedDirectMessageEventMock,
  createSignedEventMock,
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
import { getTimestampInSeconds } from '../utils';
import { Event } from './event.entity';

describe('Event entity', () => {
  describe('validate', () => {
    it('should return undefined', () => {
      expect(NON_EXPIRED_EVENT.validate()).toBeUndefined();

      const delegationEvent = Event.fromEventDto(DELEGATION_EVENT_DTO);
      expect(delegationEvent.validate()).toBeUndefined();
      expect(delegationEvent.author).toBe(
        'a734cca70ca3c08511e3c2d5a80827182e2804401fb28013a8f79da4dd6465ac',
      );
    });

    it('should return event id is wrong', () => {
      const event = Event.fromEventDto({ ...REGULAR_EVENT_DTO, id: 'fake-id' });
      expect(event.validate()).toBe('invalid: id is wrong');
    });

    it('should return signature is wrong', () => {
      const event = Event.fromEventDto({
        ...REGULAR_EVENT_DTO,
        sig: 'fake-sig',
      });
      expect(event.validate()).toBe('invalid: signature is wrong');
    });

    it('should return invalid created_at', () => {
      expect(FUTURE_REGULAR_EVENT.validate({ createdAtUpperLimit: 60 })).toBe(
        'invalid: created_at must not be later than 60 seconds from the current time',
      );
    });

    it('should handle successfully when event pow is enough', () => {
      expect(
        LEADING_8_ZERO_BITS_REGULAR_EVENT.validate({
          eventIdMinLeadingZeroBits: 8,
        }),
      ).toBeUndefined();

      expect(
        LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT.validate({
          eventIdMinLeadingZeroBits: 4,
        }),
      ).toBeUndefined();
    });

    it('should return pow is less', () => {
      expect(
        LEADING_8_ZERO_BITS_REGULAR_EVENT.validate({
          eventIdMinLeadingZeroBits: 16,
        }),
      ).toBe('pow: difficulty 8 is less than 16');

      expect(
        LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT.validate({
          eventIdMinLeadingZeroBits: 16,
        }),
      ).toBe('pow: difficulty 8 is less than 16');
    });

    it('should return event is expired', () => {
      expect(EXPIRED_EVENT.validate()).toBe('reject: event is expired');
    });

    it('should return delegation tag verification failed', () => {
      expect(DELEGATION_KIND_ERROR_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
      expect(DELEGATION_CREATED_AT_LESS_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
      expect(DELEGATION_CREATED_AT_MORE_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );

      expect(DELEGATION_MISSING_INFO_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
      expect(DELEGATION_WRONG_SIG_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
      expect(DELEGATION_MISSING_OPERATOR_EVENT.validate()).toBe(
        'invalid: delegation tag verification failed',
      );
      expect(DELEGATION_NAN_CONDITION_VALUE_EVENT.validate()).toBe(
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
      expect(Event.extractExpirationTimestamp({ tags: [] })).toBeNull();

      expect(
        Event.extractExpirationTimestamp({ tags: [['expiration']] }),
      ).toBeNull();
    });
  });

  describe('checkPermission', () => {
    it('should return true when pubkey is the sender or receiver of the encrypted DM event', () => {
      const receiver =
        'a734cca70ca3c08511e3c2d5a80827182e2804401fb28013a8f79da4dd6465ac';
      const event = createEncryptedDirectMessageEventMock({
        to: receiver,
      });

      expect(event.checkPermission(event.pubkey)).toBeTruthy();
      expect(event.checkPermission(receiver)).toBeTruthy();
    });

    it('should return true if it is not encrypted DM event', () => {
      expect(REGULAR_EVENT.checkPermission()).toBeTruthy();
    });

    it('should return false when pubkey is undefined', () => {
      expect(
        createEncryptedDirectMessageEventMock().checkPermission(),
      ).toBeFalsy();
    });

    it('should return false when the encrypted DM event has no receiver pubkey', () => {
      const event = createEncryptedDirectMessageEventMock({
        to: undefined,
      });
      expect(event.checkPermission('fake-pubkey')).toBeFalsy();

      (event as any).tags = [];
      expect(event.checkPermission('fake-pubkey')).toBeFalsy();
    });
  });

  describe('handleSignedEvent', () => {
    it('should authenticate successfully', () => {
      const challenge = randomUUID();
      const event = createSignedEventMock({ challenge });
      expect(event.validateSignedEvent(challenge, 'localhost')).toBeUndefined();
    });

    it('should authenticate failed', () => {
      const challenge = randomUUID();

      const wrongChallengeSignedEvent = createSignedEventMock({
        challenge: 'fake',
      });
      expect(
        wrongChallengeSignedEvent.validateSignedEvent(challenge, 'localhost'),
      ).toEqual('invalid: the challenge string is wrong');

      const wrongRelaySignedEvent = createSignedEventMock({
        challenge,
        relay: 'wss://fake',
      });
      expect(
        wrongRelaySignedEvent.validateSignedEvent(challenge, 'localhost'),
      ).toEqual('invalid: the relay url is wrong');

      const wrongRelayUrlSignedEvent = createSignedEventMock({
        challenge,
        relay: 'fake',
      });
      expect(
        wrongRelayUrlSignedEvent.validateSignedEvent(challenge, 'localhost'),
      ).toEqual('invalid: the relay url is wrong');

      const expiredSignedEvent = createSignedEventMock({
        challenge,
        created_at: getTimestampInSeconds() - 20 * 60,
      });
      expect(
        expiredSignedEvent.validateSignedEvent(challenge, 'localhost'),
      ).toEqual('invalid: the created_at should be within 10 minutes');

      expect(REGULAR_EVENT.validateSignedEvent(challenge, 'localhost')).toEqual(
        'invalid: the kind is not 22242',
      );
    });
  });
});
