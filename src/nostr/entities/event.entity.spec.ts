import { randomUUID } from 'crypto';
import {
  DELEGATION_EVENT,
  EXPIRED_EVENT,
  LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT,
  LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT,
  LEADING_8_ZERO_BITS_REGULAR_EVENT,
  NON_EXPIRED_EVENT,
  PUBKEY_C,
  REGULAR_EVENT,
  REGULAR_EVENT_DTO,
  createTestEncryptedDirectMessageEvent,
  createTestEvent,
  createTestSignedEvent,
} from '../../../seeds';
import { getTimestampInSeconds } from '../utils';
import { Event } from './event.entity';

describe('Event entity', () => {
  describe('validate', () => {
    it('should return undefined', () => {
      expect(NON_EXPIRED_EVENT.validate()).toBeUndefined();

      expect(DELEGATION_EVENT.validate()).toBeUndefined();
      expect(DELEGATION_EVENT.author).toBe(PUBKEY_C);
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
      expect(
        createTestEvent({
          created_at: getTimestampInSeconds() + 100,
          content: 'hello',
        }).validate({ createdAtUpperLimit: 60 }),
      ).toBe(
        'invalid: created_at must not be later than 60 seconds from the current time',
      );

      expect(
        createTestEvent({
          created_at: getTimestampInSeconds() - 100,
          content: 'hello',
        }).validate({ createdAtLowerLimit: 60 }),
      ).toBe(
        'invalid: created_at must not be earlier than 60 seconds from the current time',
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
      expect(
        createTestEvent({
          kind: 0,
          content: 'hello from a delegated key',
          tags: [
            [
              'delegation',
              PUBKEY_C,
              'kind=1&created_at<9999999999&created_at>1681822248',
              '5f57fd20390510f7efb2d686d37d2733fb86d4dd3c1f901a3de0db0ce9b86fc6ff32a6806a230efab62ffc65315ed30a78d25ef353a21727cbccce1dcaa019b6',
            ],
          ],
        }).validate(),
      ).toBe('invalid: delegation tag verification failed');
      expect(
        createTestEvent({
          created_at: 1681800000,
          content: 'hello from a delegated key',
          tags: [
            [
              'delegation',
              PUBKEY_C,
              'kind=1&created_at<9999999999&created_at>1681822248',
              '5fd4050a572bc9cec54797e170c653831c60478bdccaffa7086a29066a4beb33dbfe4c0add041a4c757c7db9e846029164a257f43a63981af45045b715dac710',
            ],
          ],
        }).validate(),
      ).toBe('invalid: delegation tag verification failed');
      expect(
        createTestEvent({
          created_at: 10000000000,
          content: 'hello from a delegated key',
          tags: [
            [
              'delegation',
              PUBKEY_C,
              'kind=1&created_at<9999999999&created_at>1681822248',
              '7d5cba60ce41ceec2f721770df0f39309bccb5dc4d9cf7779b771cfc66634a313c30b9a3a356b60af5a18ad0b7a24843f4106df39f985c176cec9fad90a6ef91',
            ],
          ],
        }).validate(),
      ).toBe('invalid: delegation tag verification failed');

      expect(
        createTestEvent({
          created_at: 10000000000,
          content: 'hello from a delegated key',
          tags: [
            [
              'delegation',
              PUBKEY_C,
              'kind=1&created_at<9999999999&created_at>1681822248',
            ],
          ],
        }).validate(),
      ).toBe('invalid: delegation tag verification failed');
      expect(
        createTestEvent({
          created_at: 10000000000,
          content: 'hello from a delegated key',
          tags: [
            [
              'delegation',
              PUBKEY_C,
              'kind=1&created_at<9999999999&created_at>1681822248',
              'fake-sig',
            ],
          ],
        }).validate(),
      ).toBe('invalid: delegation tag verification failed');
      expect(
        createTestEvent({
          content: 'hello from a delegated key',
          tags: [
            [
              'delegation',
              PUBKEY_C,
              'kind=1&created_at<9999999999&created_at',
              '41961e074bafe480da5a364a326872fb072a121ae69e807efafb2a125574af989a77b521e08b75d0e5d8a7ae8c1f5fe9b564ef486e82d9c3bce1241ebb74195b',
            ],
          ],
        }).validate(),
      ).toBe('invalid: delegation tag verification failed');
      expect(
        createTestEvent({
          tags: [
            [
              'delegation',
              PUBKEY_C,
              'kind=1&created_at<9999999999&created_at>NaN',
              'f7c19c73aea476b5f7ec78743f57f96ccac42d0ec9cc67e72c791fbc70a172ff7a6792b6def5aaedb28929fd5e5974a2259b70a8f6122fb95331dffedf54b4ca',
            ],
          ],
          content: 'hello from a delegated key',
        }).validate(),
      ).toBe('invalid: delegation tag verification failed');
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
      const event = createTestEncryptedDirectMessageEvent({
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
        createTestEncryptedDirectMessageEvent().checkPermission(),
      ).toBeFalsy();
    });

    it('should return false when the encrypted DM event has no receiver pubkey', () => {
      const event = createTestEncryptedDirectMessageEvent({
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
      const event = createTestSignedEvent({ challenge });
      expect(event.validateSignedEvent(challenge, 'localhost')).toBeUndefined();
    });

    it('should authenticate failed', () => {
      const challenge = randomUUID();

      const wrongChallengeSignedEvent = createTestSignedEvent({
        challenge: 'fake',
      });
      expect(
        wrongChallengeSignedEvent.validateSignedEvent(challenge, 'localhost'),
      ).toEqual('invalid: the challenge string is wrong');

      const wrongRelaySignedEvent = createTestSignedEvent({
        challenge,
        relay: 'wss://fake',
      });
      expect(
        wrongRelaySignedEvent.validateSignedEvent(challenge, 'localhost'),
      ).toEqual('invalid: the relay url is wrong');

      const wrongRelayUrlSignedEvent = createTestSignedEvent({
        challenge,
        relay: 'fake',
      });
      expect(
        wrongRelayUrlSignedEvent.validateSignedEvent(challenge, 'localhost'),
      ).toEqual('invalid: the relay url is wrong');

      const expiredSignedEvent = createTestSignedEvent({
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
