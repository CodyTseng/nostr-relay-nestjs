import { createCipheriv, randomFillSync, randomInt } from 'crypto';
import { Event } from '../src/nostr/entities';
import { EventDto } from '../src/nostr/schemas';
import {
  getSharedSecret,
  getTimestampInSeconds,
  schnorrSign,
  sha256,
} from '../src/nostr/utils';

export const PUBKEY_A =
  'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7';
export const PRIVKEY_A =
  '3689c9acc44041d38a44d0cb777e30f51f295a5e5565b4edb661e8f24eece569';

export const PUBKEY_B =
  '1074fe036ba490ade64fd736d4d2df70fe7264a320a3e2f5e1f1da5bb48e272d';
export const PRIVKEY_B =
  '78904abc11d6e40a3ce086119b1de41e62b91cb6bf1d066fa6d1ef51065acd59';

export const PUBKEY_C =
  'a734cca70ca3c08511e3c2d5a80827182e2804401fb28013a8f79da4dd6465ac';

export const REGULAR_EVENT_DTO = createTestEventDto({
  created_at: 1679816105,
  content: 'hello world!',
});

export const REGULAR_EVENT = Event.fromEventDto(REGULAR_EVENT_DTO);

export const REGULAR_EVENT_B = createTestEvent({
  pubkey: PUBKEY_B,
  privKey: PRIVKEY_B,
  created_at: 1679816205,
  content: 'hello world!',
});

export const REPLACEABLE_EVENT_DTO = createTestEventDto({
  created_at: 1679816038,
  kind: 0,
  content:
    '{"display_name":"Cody Tseng","website":"","name":"cody","about":"","lud06":""}',
});

export const REPLACEABLE_EVENT = Event.fromEventDto(REPLACEABLE_EVENT_DTO);

export const REPLACEABLE_EVENT_NEW = createTestEvent({
  kind: 0,
  created_at: 1679816105,
  content:
    '{"display_name":"New Cody Tseng","website":"","name":"cody","about":"","lud06":""}',
});

export const EPHEMERAL_EVENT = createTestEvent({
  kind: 20000,
  content: 'hello world!',
});

export const DELEGATION_EVENT = createTestEvent({
  created_at: 1681822528,
  content: 'hello from a delegated key',
  tags: [
    [
      'delegation',
      PUBKEY_C,
      'kind=1&created_at<9999999999&created_at>1681822248',
      'f1678c92da0cdfa3a515820e35e295ab4ad95abed08c8925da984219a3ba25e07e0493d5fb6240d83b348a48204e303b9309e43a3bb3c2b14c7827debe3a2cfd',
    ],
  ],
});

export const PARAMETERIZED_REPLACEABLE_EVENT = createTestEvent({
  created_at: 1679582827,
  kind: 30000,
  tags: [
    ['d', 'test'],
    ['p', '096ec29294b56ae7e3489307e9d5b2131bd4f0f1b8721d8600f08f39a041f6c0'],
    ['p', 'bd338e052dacfe55ff6d8cca8624df6ec9293ff3dc6c6f1dbf4b2388e9fb20fa'],
  ],
});

// id: ef45d21874ed132de29274d5ebafce77292120aa1599b33d6123c9e6feb20ac7
export const LEADING_8_ZERO_BITS_REGULAR_EVENT = createTestEvent({
  content: 'hello world!',
  tags: [['nonce', '270', '8']],
  created_at: 1680570950,
});

// id: 03ce214162a49910ab7d0837e4b6951d0aaa5b16e9c60f28d31c334a0dedf210
export const LEADING_4_ZERO_BITS_WITHOUT_NONCE_TAG_REGULAR_EVENT =
  createTestEvent({
    content: 'hello world!',
    created_at: 1680572659,
  });

// id: 0000883357a4c2adcd7374ef32e05be72146ce76b5e71bf6e08e20b982ccba94
export const LEADING_16_ZERO_BITS_8_TARGET_REGULAR_EVENT = createTestEvent({
  content: 'hello world!',
  tags: [['nonce', '82742', '8']],
  created_at: 1680573114,
});

export const EXPIRED_EVENT = createTestEvent({
  created_at: 1681223538,
  tags: [['expiration', (getTimestampInSeconds() - 1000).toString()]],
  content: 'hello',
});

export const NON_EXPIRED_EVENT = createTestEvent({
  created_at: 1681223538,
  tags: [['expiration', (getTimestampInSeconds() + 1000).toString()]],
  content: 'hello',
});

function getEventHash(
  event: Pick<EventDto, 'pubkey' | 'kind' | 'tags' | 'content' | 'created_at'>,
) {
  return sha256([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
}

function signEvent(eventId: string, key: string) {
  return schnorrSign(eventId, key);
}

export function createTestEncryptedDirectMessageEvent(
  params: {
    to?: string;
    text?: string;
    created_at?: number;
  } = {},
) {
  const {
    to = PUBKEY_B,
    text = 'hello',
    created_at = getTimestampInSeconds(),
  } = params;

  const sharedPoint = getSharedSecret(PRIVKEY_A, '02' + to);
  const sharedX = sharedPoint.slice(1, 33);

  const iv = randomFillSync(new Uint8Array(16));
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(sharedX), iv);
  let encryptedMessage = cipher.update(text, 'utf8', 'base64');
  encryptedMessage += cipher.final('base64');
  const ivBase64 = Buffer.from(iv.buffer).toString('base64');

  return createTestEvent({
    created_at,
    kind: 4,
    tags: [['p', to]],
    content: encryptedMessage + '?iv=' + ivBase64,
  });
}

export function createTestEventDto(params: {
  pubkey?: string;
  privKey?: string;
  kind?: number;
  created_at?: number;
  tags?: string[][];
  content?: string;
}) {
  const baseEvent = {
    pubkey: params.pubkey ?? PUBKEY_A,
    kind: params.kind ?? 1,
    created_at: params.created_at ?? getTimestampInSeconds(),
    tags: params.tags ?? [],
    content: params.content ?? '',
  };
  const id = getEventHash(baseEvent);
  const sig = signEvent(id, params.privKey ?? PRIVKEY_A);

  return {
    ...baseEvent,
    id,
    sig,
  };
}

export function createTestEvent(params: {
  pubkey?: string;
  privKey?: string;
  kind?: number;
  created_at?: number;
  tags?: string[][];
  content?: string;
}) {
  return Event.fromEventDto(createTestEventDto(params));
}

export function createTestSignedEventDto(
  params: {
    pubkey?: string;
    privKey?: string;
    challenge?: string;
    created_at?: number;
    relay?: string;
  } = {},
): EventDto {
  const {
    pubkey,
    privKey,
    challenge = 'challenge',
    created_at = getTimestampInSeconds(),
    relay = 'wss://localhost:3000',
  } = params;

  return createTestEventDto({
    pubkey,
    privKey,
    kind: 22242,
    created_at,
    tags: [
      ['relay', relay],
      ['challenge', challenge],
    ],
    content: '',
  });
}

export function createTestSignedEvent(
  params: {
    pubkey?: string;
    privKey?: string;
    challenge?: string;
    created_at?: number;
    relay?: string;
  } = {},
) {
  return Event.fromEventDto(createTestSignedEventDto(params));
}
