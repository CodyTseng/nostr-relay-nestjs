import {
  BeforeHandleEventPlugin,
  BeforeHandleEventResult,
  Event,
} from '@nostr-relay/common';

export class WhitelistGuardPlugin implements BeforeHandleEventPlugin {
  private readonly whitelist: Set<string>;

  constructor(whitelist: string[]) {
    this.whitelist = new Set(whitelist);
  }

  beforeHandleEvent(event: Event): BeforeHandleEventResult {
    if (!this.whitelist.has(event.pubkey)) {
      return {
        canHandle: false,
        message: 'blocked: you are banned from posting here',
      };
    }
    return { canHandle: true };
  }
}
