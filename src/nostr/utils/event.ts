import { schnorr, utils } from '@noble/secp256k1';
import { EventKind } from '../constants';
import { Event } from '../schemas';

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

export async function isEventIdValid(e: Event) {
  const arr = [0, e.pubkey, e.created_at, e.kind, e.tags, e.content];
  const id = await utils.sha256(Buffer.from(JSON.stringify(arr)));
  return Buffer.from(id).toString('hex') === e.id;
}

export async function isEventSigValid(e: Event) {
  return schnorr.verify(e.sig, e.id, e.pubkey);
}
