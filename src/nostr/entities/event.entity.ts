import { Event, EventType, EventUtils } from '@nostr-relay/common';
import { isNil } from 'lodash';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { isGenericTagName, toGenericTag } from '../utils';

@Entity({ name: 'events' })
@Index('e_author_kind_created_at_idx', ['author', 'kind', 'createdAtStr'])
@Index('e_author_created_at_idx', ['author', 'createdAtStr'])
@Index('e_author_kind_d_tag_value_idx', ['author', 'kind', 'dTagValue'], {
  sparse: true,
  unique: true,
})
@Index('e_kind_created_at_idx', ['kind', 'createdAtStr'])
@Index('e_created_at_idx', ['createdAtStr'])
export class EventEntity {
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

  type: EventType;

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

  static fromEvent(event: Event) {
    const eventEntity = new EventEntity();
    eventEntity.id = event.id;
    eventEntity.pubkey = event.pubkey;
    eventEntity.author = EventUtils.getAuthor(event);
    eventEntity.createdAt = event.created_at;
    eventEntity.kind = event.kind;
    eventEntity.tags = event.tags;
    eventEntity.content = event.content;
    eventEntity.sig = event.sig;
    eventEntity.expiredAt = EventUtils.extractExpirationTimestamp(event);
    eventEntity.dTagValue = EventUtils.extractDTagValue(event);
    eventEntity.type = EventUtils.getType(event);

    const genericTagSet = new Set<string>();
    event.tags.forEach(([tagName, tagValue]) => {
      if (isGenericTagName(tagName)) {
        genericTagSet.add(toGenericTag(tagName, tagValue));
      }
    });
    eventEntity.genericTags = [...genericTagSet];

    return eventEntity;
  }

  toEvent(): Event {
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
}
