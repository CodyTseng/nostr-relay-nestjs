import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WotGuard } from '@nostr-relay/wot-guard';
import { Config } from 'src/config';
import { EventRepository } from '../repositories/event.repository';
import { NostrRelayLogger } from '../share/nostr-relay-logger.service';

@Injectable()
export class WotService implements OnApplicationBootstrap {
  private readonly wotGuardPlugin: WotGuard;

  constructor(
    configService: ConfigService<Config, true>,
    nostrRelayLogger: NostrRelayLogger,
    eventRepository: EventRepository,
  ) {
    const wotConfig = configService.get('wot', { infer: true });

    this.wotGuardPlugin = new WotGuard({
      enabled: !!wotConfig.trustAnchorPubkey,
      trustAnchorPubkey: wotConfig.trustAnchorPubkey,
      trustDepth: wotConfig.trustDepth,
      relayUrls: wotConfig.fetchFollowListFrom,
      skipFilters: wotConfig.skipFilters,
      logger: nostrRelayLogger,
      eventRepository,
    });
  }

  async onApplicationBootstrap() {
    await this.wotGuardPlugin?.init();
  }

  getWotGuardPlugin() {
    return this.wotGuardPlugin;
  }

  checkPubkeyIsTrusted(pubkey: string) {
    const wotEnabled = this.wotGuardPlugin.getEnabled();
    return wotEnabled ? this.wotGuardPlugin.checkPubkey(pubkey) : true;
  }

  async refreshWot() {
    await this.wotGuardPlugin.refreshTrustedPubkeySet();
  }
}
