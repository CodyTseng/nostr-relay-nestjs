import { ColumnType, Generated, JSONColumnType, Selectable } from 'kysely';

export interface Database {
  events: EventTable;
  generic_tags: GenericTagTable;
}

interface EventTable {
  id: string;
  pubkey: string;
  author: string;
  created_at: number;
  kind: number;
  tags: JSONColumnType<string[][]>;
  generic_tags: string[];
  content: string;
  sig: string;
  expired_at: number | null;
  d_tag_value: string | null;
  create_date: ColumnType<Date, string, string>;
}
export type EventRow = Selectable<EventTable>;

interface GenericTagTable {
  id: Generated<number>;
  tag: string;
  author: string;
  kind: number;
  event_id: string;
  created_at: number;
}
