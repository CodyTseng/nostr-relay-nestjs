import { Module } from '@nestjs/common';
import { ConnectionManagerService } from './connection-manager.service';

@Module({
  providers: [ConnectionManagerService],
  exports: [ConnectionManagerService],
})
export class ConnectionManagerModule {}
