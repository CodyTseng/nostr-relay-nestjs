import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventRepository } from '../repositories/event.repository';
import { DbEvent, DbEventSchema } from './db-event.schema';
import { MongoEventRepository } from './mongo-event.repository';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        const uri = process.env.MONGO_URL;
        if (!uri) {
          throw new Error('missing MONGO_URL');
        }
        return { uri };
      },
    }),
    MongooseModule.forFeature([{ name: DbEvent.name, schema: DbEventSchema }]),
  ],
  providers: [
    {
      provide: EventRepository,
      useClass: MongoEventRepository,
    },
  ],
  exports: [EventRepository],
})
export class MongoRepositoriesModule {}
