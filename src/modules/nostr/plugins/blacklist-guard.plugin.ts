import {
  BeforeHandleEventPlugin,
  BeforeHandleEventResult,
  Event,
} from '@nostr-relay/common';

export class BlacklistGuardPlugin implements BeforeHandleEventPlugin {
  private readonly blacklist: Set<string>;

  constructor(blacklist: string[]) {
    this.blacklist = new Set(blacklist);
  }

  beforeHandleEvent(event: Event): BeforeHandleEventResult {
    if (this.blacklist.has(event.pubkey)) {
      return {
        canHandle: false,
        message: 'blocked: you are banned from posting here',
      };
    }
    return { canHandle: true };
  }
}
