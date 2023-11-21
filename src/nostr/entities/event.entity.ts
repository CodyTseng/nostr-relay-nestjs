import { isNil } from 'lodash';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { EventKind, EventType, TagName } from '../constants';
import { EventDto } from '../schemas';
import {
  countLeadingZeroBits,
  getTimestampInSeconds,
  isGenericTagName,
  schnorrVerify,
  sha256,
  toGenericTag,
} from '../utils';

const EVENT_TYPE_SYMBOL = Symbol('event:type');

@Entity({ name: 'events' })
@Index('e_author_kind_created_at_idx', ['author', 'kind', 'createdAtStr'])
@Index('e_author_created_at_idx', ['author', 'createdAtStr'])
@Index(
  'e_author_kind_d_tag_value_created_at_idx',
  ['author', 'kind', 'dTagValue', 'createdAtStr'],
  { sparse: true, unique: true },
)
@Index('e_kind_created_at_idx', ['kind', 'createdAtStr'])
@Index('e_created_at_idx', ['createdAtStr'])
export class Event {
  @PrimaryColumn({ type: 'char', length: 64 })
  id: string;

  @Column({ type: 'char', length: 64 })
  pubkey: string;

  @Column({ type: 'char', length: 64 })
  author: string;

  @Column({ type: 'bigint', name: 'created_at' })
  createdAtStr: string;

  @Column()
  kind: number;

  @Column({ type: 'jsonb', default: [] })
  tags: string[][];

  @Column({ type: 'text', array: true, default: [], name: 'generic_tags' })
  genericTags: string[];

  @Column({ type: 'text', default: '' })
  content: string;

  @Column({ type: 'char', length: 128 })
  sig: string;

  @Column({ type: 'bigint', nullable: true, name: 'expired_at' })
  expiredAtStr: string | null;

  @Column({ type: 'text', nullable: true, name: 'd_tag_value' })
  dTagValue: string | null;

  @CreateDateColumn({ name: 'create_date', select: false })
  _createDate: Date;

  get type() {
    if (!this[EVENT_TYPE_SYMBOL]) {
      this[EVENT_TYPE_SYMBOL] = Event.getEventType(this);
    }
    return this[EVENT_TYPE_SYMBOL];
  }

  get createdAt() {
    return parseInt(this.createdAtStr);
  }

  set createdAt(createdAt: number) {
    this.createdAtStr = createdAt.toString();
  }

  get expiredAt() {
    return isNil(this.expiredAtStr) ? null : parseInt(this.expiredAtStr);
  }

  set expiredAt(expiredAt: number | null) {
    this.expiredAtStr = expiredAt?.toString() ?? null;
  }

  static fromEventDto(eventDto: EventDto) {
    const event = new Event();
    event.id = eventDto.id;
    event.pubkey = eventDto.pubkey;
    event.author = eventDto.pubkey;
    event.createdAt = eventDto.created_at;
    event.kind = eventDto.kind;
    event.tags = eventDto.tags;
    event.content = eventDto.content;
    event.sig = eventDto.sig;
    event.expiredAt = Event.extractExpirationTimestamp(eventDto);
    event.dTagValue =
      event.type === EventType.PARAMETERIZED_REPLACEABLE
        ? Event.extractDTagValueFromEvent(eventDto)
        : event.type === EventType.REPLACEABLE
          ? ''
          : null;

    const genericTagSet = new Set<string>();
    eventDto.tags.forEach(([tagName, tagValue]) => {
      if (isGenericTagName(tagName)) {
        genericTagSet.add(toGenericTag(tagName, tagValue));
      }
    });
    event.genericTags = [...genericTagSet];

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

  static extractExpirationTimestamp(event: Pick<Event, 'tags'>): number | null {
    const expirationTag = event.tags.find(
      ([tagName]) => tagName === TagName.EXPIRATION,
    );
    if (!expirationTag) {
      return null;
    }

    const expirationTimestamp = parseInt(expirationTag[1]);
    return isNaN(expirationTimestamp) ? null : expirationTimestamp;
  }

  checkPermission(pubkey?: string) {
    if (this.kind !== EventKind.ENCRYPTED_DIRECT_MESSAGE) {
      return true;
    }

    if (!pubkey) {
      return false;
    }

    if (this.author === pubkey) {
      return true;
    }

    const pubkeyTag = this.tags.find(([tagName]) => tagName === TagName.PUBKEY);
    return pubkeyTag ? pubkey === pubkeyTag[1] : false;
  }

  validate(
    options: {
      createdAtUpperLimit?: number;
      createdAtLowerLimit?: number;
      eventIdMinLeadingZeroBits?: number;
    } = {},
  ): string | undefined {
    if (!this.isEventIdValid()) {
      return 'invalid: id is wrong';
    }

    if (!this.isEventSigValid()) {
      return 'invalid: signature is wrong';
    }

    const now = getTimestampInSeconds();

    if (this.expiredAt && this.expiredAt < now) {
      return 'reject: event is expired';
    }

    if (
      !isNil(options.createdAtUpperLimit) &&
      this.createdAt - now > options.createdAtUpperLimit
    ) {
      return `invalid: created_at must not be later than ${options.createdAtUpperLimit} seconds from the current time`;
    }

    if (
      !isNil(options.createdAtLowerLimit) &&
      now - this.createdAt > options.createdAtLowerLimit
    ) {
      return `invalid: created_at must not be earlier than ${options.createdAtLowerLimit} seconds from the current time`;
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
      if (!this.isDelegationTagValid(delegationTag)) {
        return 'invalid: delegation tag verification failed';
      }
      this.author = delegationTag[1];
    }
  }

  validateSignedEvent(clientId: string, domain: string): string | void {
    const validateErrorMsg = this.validate();
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

  private isEventIdValid() {
    return (
      sha256([
        0,
        this.pubkey,
        this.createdAt,
        this.kind,
        this.tags,
        this.content,
      ]) === this.id
    );
  }

  private isEventSigValid() {
    return schnorrVerify(this.sig, this.id, this.pubkey);
  }

  private isDelegationTagValid(delegationTag: string[]) {
    if (delegationTag.length !== 4) {
      return false;
    }
    const [, delegator, conditionsStr, token] = delegationTag;

    const delegationStr = sha256(
      `nostr:delegation:${this.pubkey}:${conditionsStr}`,
    );

    if (!schnorrVerify(token, delegationStr, delegator)) {
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
