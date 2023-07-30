import { z } from 'zod';
import { EVENT_ID_LENGTH, PUBKEY_LENGTH, SIGNATURE_LENGTH } from '../constants';

export const TimestampInSecSchema = z
  .number({ invalid_type_error: 'must be a number' })
  .int({ message: 'must be an integer' })
  .min(0, { message: 'must be greater than or equal to 0' });

export const HexStringSchema = z
  .string({ invalid_type_error: 'must be a string' })
  .regex(/^[0-9a-f]+$/, { message: 'must be a hex string' });

export const EventIdSchema = HexStringSchema.length(EVENT_ID_LENGTH, {
  message: `must be ${EVENT_ID_LENGTH} characters`,
});

export const EventIdPrefixSchema = HexStringSchema.min(4, {
  message: 'must be at least 4 characters',
}).max(EVENT_ID_LENGTH, {
  message: `must be less than or equal to ${EVENT_ID_LENGTH} characters`,
});

export const PubkeySchema = HexStringSchema.length(PUBKEY_LENGTH, {
  message: `must be ${PUBKEY_LENGTH} characters`,
});

export const PubkeyPrefixSchema = HexStringSchema.min(4, {
  message: 'must be at least 4 characters',
}).max(PUBKEY_LENGTH, {
  message: `must be less than or equal to ${PUBKEY_LENGTH} characters`,
});

export const EventKindSchema = z
  .number({ invalid_type_error: 'must be a number' })
  .int({ message: 'must be an integer' })
  .min(0, { message: 'must be greater than or equal to 0' });

export const EventTagSchema = z
  .array(
    z
      .string({ invalid_type_error: 'must be a string' })
      .max(1024, { message: 'must be less than 1024 chars' }),
  )
  .max(10, { message: 'must be less than or equal to 10 tag items' });

export const EventContentSchema = z
  .string({ invalid_type_error: 'must be a string' })
  .max(100 * 1024, { message: 'must be less than or equal to 102400 chars' });

export const EventSigSchema = HexStringSchema.length(SIGNATURE_LENGTH, {
  message: `must be ${SIGNATURE_LENGTH} characters`,
});

export const SubscriptionIdSchema = z
  .string({ invalid_type_error: 'must be a string' })
  .min(1, { message: 'must be at least 1 character' })
  .max(64, {
    message: 'must be less than or equal to 64 characters',
  });

export const SearchSchema = z
  .string({ invalid_type_error: 'must be a string' })
  .max(256, {
    message: 'must be less than or equal to 256 chars',
  });
