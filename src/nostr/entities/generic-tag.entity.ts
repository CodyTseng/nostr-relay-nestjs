import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Event } from './event.entity';

@Entity({ name: 'generic_tags' })
@Index('g_tag_created_at_idx', ['tag', 'createdAt'])
@Index('g_tag_kind_created_at_idx', ['tag', 'kind', 'createdAt'])
@Index('g_tag_event_id_idx', ['tag', 'eventId'], { unique: true })
export class GenericTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  tag: string;

  @Column({ type: 'char', length: 64 })
  author: string;

  @Column()
  kind: number;

  @Column({ type: 'char', length: 64, name: 'event_id' })
  eventId: string;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'bigint', name: 'created_at' })
  createdAt: string;
}
