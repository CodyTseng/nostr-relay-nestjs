import { schnorr, utils } from '@noble/secp256k1';
import { isNil } from 'lodash';
import { EventKind, EventType, MAX_TIMESTAMP, TagName } from '../constants';
import {
  EventContent,
  EventDto,
  EventId,
  EventSig,
  EventTag,
  Pubkey,
  TimestampInSeconds,
} from '../schemas';
import { countLeadingZeroBits, getTimestampInSeconds } from '../utils';

export class Event {
  readonly type: EventType;
  readonly id: EventId;
  readonly pubkey: Pubkey;
  readonly created_at: TimestampInSeconds;
  readonly kind: EventKind;
  readonly tags: EventTag[];
  readonly content: EventContent;
  readonly sig: EventSig;
  readonly expirationTimestamp: TimestampInSeconds;
  readonly dTagValue?: string;
  delegator?: Pubkey;

  constructor(
    event: Pick<
      Event,
      | 'type'
      | 'id'
      | 'content'
      | 'created_at'
      | 'kind'
      | 'pubkey'
      | 'sig'
      | 'tags'
      | 'dTagValue'
      | 'expirationTimestamp'
      | 'delegator'
    >,
  ) {
    this.type = event.type;
    this.id = event.id;
    this.pubkey = event.pubkey;
    this.created_at = event.created_at;
    this.kind = event.kind;
    this.tags = event.tags;
    this.content = event.content;
    this.sig = event.sig;
    this.expirationTimestamp = event.expirationTimestamp;
    this.dTagValue = event.dTagValue;
    this.delegator = event.delegator;
  }

  static fromEventDto(eventDto: EventDto) {
    const type = Event.getEventType(eventDto);
    return new Event({
      type,
      id: eventDto.id,
      pubkey: eventDto.pubkey,
      created_at: eventDto.created_at,
      kind: eventDto.kind,
      tags: eventDto.tags,
      content: eventDto.content,
      sig: eventDto.sig,
      expirationTimestamp: Event.extractExpirationTimestamp(eventDto),
      dTagValue:
        type === EventType.PARAMETERIZED_REPLACEABLE
          ? Event.extractDTagValueFromEvent(eventDto)
          : undefined,
    });
  }

  static getEventType({ kind }: Pick<Event, 'kind'>) {
    if (
      [
        EventKind.SET_METADATA,
        EventKind.CONTACT_LIST,
        EventKind.CHANNEL_METADATA,
      ].includes(kind) ||
      (kind >= EventKind.REPLACEABLE_FIRST &&
        kind <= EventKind.REPLACEABLE_LAST)
    ) {
      return EventType.REPLACEABLE;
    }

    if (kind >= EventKind.EPHEMERAL_FIRST && kind <= EventKind.EPHEMERAL_LAST) {
      return EventType.EPHEMERAL;
    }

    if (kind === EventKind.DELETION) {
      return EventType.DELETION;
    }

    if (
      kind >= EventKind.PARAMETERIZED_REPLACEABLE_FIRST &&
      kind <= EventKind.PARAMETERIZED_REPLACEABLE_LAST
    ) {
      return EventType.PARAMETERIZED_REPLACEABLE;
    }

    return EventType.REGULAR;
  }

  static extractDTagValueFromEvent(event: Pick<Event, 'tags'>) {
    const [, dTagValue] = event.tags.find(
      ([tagName, tagValue]) => tagName === TagName.D && !!tagValue,
    ) ?? [TagName.D, ''];

    return dTagValue;
  }

  static extractExpirationTimestamp(event: Pick<Event, 'tags'>): number {
    const expirationTag = event.tags.find(
      ([tagName]) => tagName === TagName.EXPIRATION,
    );
    if (!expirationTag) {
      return MAX_TIMESTAMP;
    }

    const expirationTimestamp = parseInt(expirationTag[1]);
    return isNaN(expirationTimestamp) ? MAX_TIMESTAMP : expirationTimestamp;
  }

  checkPermission(pubkey?: Pubkey) {
    if (this.kind !== EventKind.ENCRYPTED_DIRECT_MESSAGE) {
      return true;
    }

    if (!pubkey) {
      return false;
    }

    if ([this.pubkey, this.delegator].includes(pubkey)) {
      return true;
    }

    const pubkeyTag = this.tags.find(([tagName]) => tagName === TagName.PUBKEY);
    return pubkeyTag ? pubkey === pubkeyTag[1] : false;
  }

  async validate(
    options: {
      createdAtUpperLimit?: number;
      eventIdMinLeadingZeroBits?: number;
    } = {},
  ): Promise<string | void> {
    if (!(await this.isEventIdValid())) {
      return 'invalid: id is wrong';
    }

    if (!(await this.isEventSigValid())) {
      return 'invalid: signature is wrong';
    }

    const now = getTimestampInSeconds();

    if (this.expirationTimestamp < now) {
      return 'reject: event is expired';
    }

    if (
      !isNil(options.createdAtUpperLimit) &&
      this.created_at - now > options.createdAtUpperLimit
    ) {
      return `invalid: created_at must not be later than ${options.createdAtUpperLimit} seconds from the current time`;
    }

    if (
      options.eventIdMinLeadingZeroBits &&
      options.eventIdMinLeadingZeroBits > 0
    ) {
      const pow = countLeadingZeroBits(this.id);
      if (pow < options.eventIdMinLeadingZeroBits) {
        return `pow: difficulty ${pow} is less than ${options.eventIdMinLeadingZeroBits}`;
      }

      const nonceTag = this.tags.find(
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

    const delegationTag = this.tags.find(
      ([tagName]) => tagName === TagName.DELEGATION,
    );
    if (delegationTag) {
      if (!(await this.isDelegationTagValid(delegationTag))) {
        return 'invalid: delegation tag verification failed';
      }
      this.delegator = delegationTag[1];
    }
  }

  toEventDto(): EventDto {
    return {
      id: this.id,
      pubkey: this.pubkey,
      created_at: this.created_at,
      kind: this.kind,
      tags: this.tags,
      content: this.content,
      sig: this.sig,
    };
  }

  private async isEventIdValid() {
    const arr = [
      0,
      this.pubkey,
      this.created_at,
      this.kind,
      this.tags,
      this.content,
    ];
    const id = await utils.sha256(Buffer.from(JSON.stringify(arr)));
    return Buffer.from(id).toString('hex') === this.id;
  }

  private async isEventSigValid() {
    return schnorr.verify(this.sig, this.id, this.pubkey);
  }

  private async isDelegationTagValid(delegationTag: string[]) {
    if (delegationTag.length !== 4) {
      return false;
    }
    const [, delegator, conditionsStr, token] = delegationTag;

    const delegationStr = await utils.sha256(
      Buffer.from(`nostr:delegation:${this.pubkey}:${conditionsStr}`),
    );
    if (!(await schnorr.verify(token, delegationStr, delegator))) {
      return false;
    }

    return conditionsStr.split('&').every((conditionStr) => {
      const operatorIndex = conditionStr.search(/[=><]/);
      if (operatorIndex < 0) {
        return false;
      }

      const operator = conditionStr[operatorIndex];
      const attribute = conditionStr.slice(0, operatorIndex);
      const value = parseInt(conditionStr.slice(operatorIndex + 1));

      if (isNaN(value)) {
        return false;
      }
      if (attribute === 'kind' && operator === '=') {
        return this.kind === value;
      }
      if (attribute === 'created_at' && operator === '>') {
        return this.created_at > value;
      }
      if (attribute === 'created_at' && operator === '<') {
        return this.created_at < value;
      }
    });
  }
}
