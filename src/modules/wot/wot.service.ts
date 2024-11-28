import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WotGuard, WotGuardOptions } from '@nostr-relay/wot-guard';
import { Filter } from '@nostr-relay/common';
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

    // Convert string filters to Filter objects
    const skipFilters = wotConfig?.skipFilters?.map((filter: string) => {
      try {
        return JSON.parse(filter) as Filter;
      } catch {
        return null;
      }
    }).filter((filter): filter is Filter => filter !== null) ?? [];

    this.wotGuardPlugin = new WotGuard({
      enabled: !!wotConfig.trustAnchorPubkey,
      trustAnchorPubkey: wotConfig.trustAnchorPubkey,
      trustDepth: wotConfig.trustDepth,
      relayUrls: wotConfig.fetchFollowListFrom,
      skipFilters,
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
