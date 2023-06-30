import { schnorr, utils } from '@noble/secp256k1';
import { isNil } from 'lodash';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  EventKind,
  EventType,
  MAX_TIMESTAMP,
  STANDARD_SINGLE_LETTER_TAG_NAMES,
  TagName,
} from '../constants';
import { EventDto } from '../schemas';
import { countLeadingZeroBits, getTimestampInSeconds } from '../utils';

const EVENT_TYPE_SYMBOL = Symbol('event:type');

@Entity({ name: 'event' })
export class Event {
  @PrimaryColumn({ type: 'char', length: 64 })
  id: string;

  @Column({ type: 'char', length: 64 })
  pubkey: string;

  @Column({ type: 'bigint', name: 'created_at' })
  createdAtStr: string;

  @Column()
  kind: number;

  @Column({ type: 'jsonb', default: [] })
  tags: string[][];

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'char', length: 128 })
  sig: string;

  @Column({ type: 'bigint', default: MAX_TIMESTAMP, name: 'expired_at' })
  expiredAt: number;

  @Column({ type: 'text', nullable: true, name: 'd_tag_value' })
  dTagValue?: string;

  @Column({ type: 'char', length: 64, nullable: true })
  delegator?: string;

  @Column({ type: 'text', array: true, default: [] })
  a?: string[];

  @Column({ type: 'text', array: true, default: [] })
  d?: string[];

  @Column({ type: 'text', array: true, default: [] })
  e?: string[];

  @Column({ type: 'text', array: true, default: [] })
  g?: string[];

  @Column({ type: 'text', array: true, default: [] })
  i?: string[];

  @Column({ type: 'text', array: true, default: [] })
  l?: string[];

  @Column({ type: 'text', array: true, default: [] })
  L?: string[];

  @Column({ type: 'text', array: true, default: [] })
  p?: string[];

  @Column({ type: 'text', array: true, default: [] })
  r?: string[];

  @Column({ type: 'text', array: true, default: [] })
  t?: string[];

  @CreateDateColumn({ name: 'create_date', select: false })
  createDate: Date;

  @UpdateDateColumn({ name: 'update_date', select: false })
  updateDate: Date;

  @DeleteDateColumn({ name: 'delete_date', nullable: true, select: false })
  deleteDate?: Date;

  get type() {
    if (!this[EVENT_TYPE_SYMBOL]) {
      this[EVENT_TYPE_SYMBOL] = Event.getEventType(this);
    }
    return this[EVENT_TYPE_SYMBOL];
  }

  get createdAt() {
    return parseInt(this.createdAtStr);
  }

  set createdAt(created_at: number) {
    this.createdAtStr = created_at.toString();
  }

  static fromEventDto(eventDto: EventDto) {
    const event = new Event();
    event.id = eventDto.id;
    event.pubkey = eventDto.pubkey;
    event.createdAt = eventDto.created_at;
    event.kind = eventDto.kind;
    event.tags = eventDto.tags;
    event.content = eventDto.content;
    event.sig = eventDto.sig;
    event.expiredAt = Event.extractExpirationTimestamp(eventDto);
    event.dTagValue =
      event.type === EventType.PARAMETERIZED_REPLACEABLE
        ? Event.extractDTagValueFromEvent(eventDto)
        : undefined;

    eventDto.tags.forEach(([tagName, tagValue]) => {
      if (STANDARD_SINGLE_LETTER_TAG_NAMES.includes(tagName)) {
        event[tagName]
          ? event[tagName].push(tagValue)
          : (event[tagName] = [tagValue]);
      }
    });
    return event;
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

  checkPermission(pubkey?: string) {
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

    if (this.expiredAt < now) {
      return 'reject: event is expired';
    }

    if (
      !isNil(options.createdAtUpperLimit) &&
      this.createdAt - now > options.createdAtUpperLimit
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

  async validateSignedEvent(
    clientId: string,
    domain: string,
  ): Promise<string | void> {
    const validateErrorMsg = await this.validate();
    if (validateErrorMsg) {
      return validateErrorMsg;
    }

    if (this.kind !== EventKind.AUTHENTICATION) {
      return 'invalid: the kind is not 22242';
    }

    let challenge = '',
      relay = '';
    this.tags.forEach(([tagName, tagValue]) => {
      if (tagName === TagName.CHALLENGE) {
        challenge = tagValue;
      } else if (tagName === TagName.RELAY) {
        relay = tagValue;
      }
    });

    if (challenge !== clientId) {
      return 'invalid: the challenge string is wrong';
    }

    try {
      if (new URL(relay).hostname !== domain) {
        return 'invalid: the relay url is wrong';
      }
    } catch {
      return 'invalid: the relay url is wrong';
    }

    if (Math.abs(this.createdAt - getTimestampInSeconds()) > 10 * 60) {
      return 'invalid: the created_at should be within 10 minutes';
    }
  }

  toEventDto(): EventDto {
    return {
      id: this.id,
      pubkey: this.pubkey,
      created_at: this.createdAt,
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
      this.createdAt,
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
        return this.createdAt > value;
      }
      if (attribute === 'created_at' && operator === '<') {
        return this.createdAt < value;
      }
    });
  }
}
