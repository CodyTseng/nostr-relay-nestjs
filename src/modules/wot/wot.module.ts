import { Module } from '@nestjs/common';
import { RepositoriesModule } from '../repositories/repositories.module';
import { ShareModule } from '../share/share.module';
import { WotController } from './wot.controller';
import { WotService } from './wot.service';

@Module({
  imports: [ShareModule, RepositoriesModule],
  controllers: [WotController],
  providers: [WotService],
  exports: [WotService],
})
export class WotModule {}
