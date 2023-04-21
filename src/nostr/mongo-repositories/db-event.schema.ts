import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { MAX_TIMESTAMP } from '../constants';

export type DbEventDocument = HydratedDocument<DbEvent>;

@Schema({ _id: false, collection: 'event', timestamps: true })
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

  @Prop({ default: MAX_TIMESTAMP })
  expirationTimestamp: number;

  @Prop({})
  dTagValue?: string;

  @Prop({})
  delegator?: string;

  @Prop({ default: false })
  deleted: boolean;
}

export const DbEventSchema = SchemaFactory.createForClass(DbEvent);
