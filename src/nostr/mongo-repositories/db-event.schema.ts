import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DbEventDocument = HydratedDocument<DbEvent>;

@Schema({ _id: false, collection: 'event' })
export class DbEvent {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  pubkey: string;

  @Prop({ required: true })
  created_at: number;

  @Prop({ required: true })
  kind: number;

  @Prop([[String]])
  tags: string[][];

  @Prop({ default: '' })
  content: string;

  @Prop({ required: true })
  sig: string;

  @Prop({ default: false })
  deleted: boolean;
}

export const DbEventSchema = SchemaFactory.createForClass(DbEvent);
