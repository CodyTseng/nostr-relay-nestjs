import { ColumnType, Generated, JSONColumnType, Selectable } from 'kysely';

export interface Database {
  events: EventTable;
  generic_tags: GenericTagTable;
  nip05: Nip05Table;
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

interface Nip05Table {
  name: string;
  pubkey: string;
  create_date: ColumnType<Date, string | undefined, string>;
}
export type Nip05Row = Selectable<Nip05Table>;
