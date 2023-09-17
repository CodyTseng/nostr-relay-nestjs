import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Event } from './event.entity';

@Entity({ name: 'generic_tags' })
export class GenericTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  tag: string;

  @ManyToOne(() => Event, (event) => event.genericTags)
  event: Event;

  @Column({ type: 'bigint', name: 'created_at' })
  createdAt: string;
}
