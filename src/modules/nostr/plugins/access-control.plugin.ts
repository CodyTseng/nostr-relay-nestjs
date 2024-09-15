import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BeforeHandleEventPlugin,
  BeforeHandleEventResult,
  Event,
} from '@nostr-relay/common';
import { Config } from 'src/config';

@Injectable()
export class AccessControlPlugin implements BeforeHandleEventPlugin {
  private readonly blacklist: Set<string> | undefined;
  private readonly whitelist: Set<string> | undefined;

  constructor(config: ConfigService<Config, true>) {
    const limitConfig = config.get('limit', { infer: true });
    if (limitConfig.blacklist?.length) {
      this.blacklist = new Set(limitConfig.blacklist);
    }
    if (limitConfig.whitelist?.length) {
      this.whitelist = new Set(limitConfig.whitelist);
    }
  }

  beforeHandleEvent(event: Event): BeforeHandleEventResult {
    if (
      (this.blacklist && this.blacklist.has(event.pubkey)) ||
      (this.whitelist && !this.whitelist.has(event.pubkey))
    ) {
      return {
        canHandle: false,
        message: 'blocked: you are banned from posting here',
      };
    }
    return { canHandle: true };
  }
}
