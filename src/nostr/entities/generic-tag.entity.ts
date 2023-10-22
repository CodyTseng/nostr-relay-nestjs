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
@Index('g_tag_created_at_desc_event_id_idx', { synchronize: false })
@Index('g_tag_kind_created_at_desc_event_id_idx', { synchronize: false })
@Index('g_event_id_tag_idx', ['eventId', 'tag'], { unique: true })
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

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ type: 'bigint', name: 'created_at' })
  createdAt: string;
}
