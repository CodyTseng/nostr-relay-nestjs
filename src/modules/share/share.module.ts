import { Module } from '@nestjs/common';
import { NostrRelayLogger } from './nostr-relay-logger.service';

@Module({
  providers: [NostrRelayLogger],
  exports: [NostrRelayLogger],
})
export class ShareModule {}
