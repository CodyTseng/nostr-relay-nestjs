import {
  TagName,
  countPowDifficulty,
  Event,
  getTimestampInSeconds,
  sha256,
  schnorrSign,
} from '@nostr-relay/common';

export function createEvent(
  params: {
    kind?: number;
    created_at?: number;
    tags?: string[][];
    content?: string;
    minPowDifficulty?: number;
    targetPowDifficulty?: number;
  } = {},
): Event {
  const tags = params.tags ?? [];
  let nonce = 0;
  if (params.minPowDifficulty) {
    tags.push(
      params.targetPowDifficulty
        ? [
            TagName.NONCE,
            nonce.toString(),
            params.targetPowDifficulty.toString(),
          ]
        : [TagName.NONCE, nonce.toString()],
    );
  }

  const baseEvent = {
    pubkey: 'a09659cd9ee89cd3743bc29aa67edf1d7d12fb624699fcd3d6d33eef250b01e7',
    kind: params.kind ?? 1,
    created_at: params.created_at ?? getTimestampInSeconds(),
    tags,
    content: params.content ?? '',
  };

  let id = getEventHash(baseEvent);
  if (params.minPowDifficulty) {
    while (countPowDifficulty(id) < params.minPowDifficulty) {
      baseEvent.tags.find((tag) => tag[0] === TagName.NONCE)![1] =
        (++nonce).toString();
      id = getEventHash(baseEvent);
    }
  }
  const sig = signEvent(
    id,
    '3689c9acc44041d38a44d0cb777e30f51f295a5e5565b4edb661e8f24eece569',
  );

  return {
    ...baseEvent,
    id,
    sig,
  };
}

function getEventHash(
  event: Pick<Event, 'pubkey' | 'kind' | 'tags' | 'content' | 'created_at'>,
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
