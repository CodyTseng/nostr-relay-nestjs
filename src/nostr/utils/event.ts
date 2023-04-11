import { schnorr, utils } from '@noble/secp256k1';
import { isNil } from 'lodash';
import { EventKind, TagName } from '../constants';
import { Event } from '../schemas';
import { countLeadingZeroBits } from './proof-of-work';
import { getTimestampInSeconds } from './time';

export function isReplaceableEvent({ kind }: Event) {
  return (
    [
      EventKind.SET_METADATA,
      EventKind.CONTACT_LIST,
      EventKind.CHANNEL_METADATA,
    ].includes(kind) ||
    (kind >= EventKind.REPLACEABLE_FIRST && kind <= EventKind.REPLACEABLE_LAST)
  );
}

export function isEphemeralEvent({ kind }: Event) {
  return kind >= EventKind.EPHEMERAL_FIRST && kind <= EventKind.EPHEMERAL_LAST;
}

export function isDeletionEvent({ kind }: Event) {
  return kind === EventKind.DELETION;
}

export function isParameterizedReplaceableEvent({ kind }: Event) {
  return (
    kind >= EventKind.PARAMETERIZED_REPLACEABLE_FIRST &&
    kind <= EventKind.PARAMETERIZED_REPLACEABLE_LAST
  );
}

export async function isEventIdValid(e: Event) {
  const arr = [0, e.pubkey, e.created_at, e.kind, e.tags, e.content];
  const id = await utils.sha256(Buffer.from(JSON.stringify(arr)));
  return Buffer.from(id).toString('hex') === e.id;
}

export async function isEventSigValid(e: Event) {
  return schnorr.verify(e.sig, e.id, e.pubkey);
}

export async function isEventValid(
  e: Event,
  options: {
    createdAtUpperLimit?: number;
    eventIdMinLeadingZeroBits?: number;
  } = {},
): Promise<string | void> {
  if (!(await isEventIdValid(e))) {
    return 'invalid: id is wrong';
  }

  if (!(await isEventSigValid(e))) {
    return 'invalid: signature is wrong';
  }

  const now = getTimestampInSeconds();

  const expirationTimestamp = extractExpirationTimestamp(e);
  if (expirationTimestamp && expirationTimestamp < now) {
    return 'reject: event is expired';
  }

  if (
    !isNil(options.createdAtUpperLimit) &&
    e.created_at - now > options.createdAtUpperLimit
  ) {
    return `invalid: created_at must not be later than ${options.createdAtUpperLimit} seconds from the current time`;
  }

  if (
    options.eventIdMinLeadingZeroBits &&
    options.eventIdMinLeadingZeroBits > 0
  ) {
    const pow = countLeadingZeroBits(e.id);
    if (pow < options.eventIdMinLeadingZeroBits) {
      return `pow: difficulty ${pow} is less than ${options.eventIdMinLeadingZeroBits}`;
    }

    const nonceTag = e.tags.find(
      (tag) => tag[0] === TagName.NONCE && tag.length === 3,
    );
    if (!nonceTag) {
      return;
    }

    const targetPow = parseInt(nonceTag[2]);
    if (isNaN(targetPow) || targetPow < options.eventIdMinLeadingZeroBits) {
      return `pow: difficulty ${targetPow} is less than ${options.eventIdMinLeadingZeroBits}`;
    }
  }
}

export function extractDTagValueFromEvent(event: Pick<Event, 'tags'>) {
  const [, dTagValue] = event.tags.find(
    ([tagName, tagValue]) => tagName === TagName.D && !!tagValue,
  ) ?? [TagName.D, ''];

  return dTagValue;
}

export function extractExpirationTimestamp(
  event: Pick<Event, 'tags'>,
): number | undefined {
  const expirationTag = event.tags.find(
    ([tagName]) => tagName === TagName.EXPIRATION,
  );
  if (!expirationTag) {
    return;
  }

  const expirationTimestamp = parseInt(expirationTag[1]);
  return isNaN(expirationTimestamp) ? undefined : expirationTimestamp;
}
