import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Config } from '../../../config';

@Controller()
@ApiExcludeController()
export class NostrController {
  private readonly relayInfoDoc: {
    name: string;
    version: string;
    description: string;
    pubkey?: string;
    contact?: string;
    software: string;
    git_commit_sha?: string;
    supported_nips: number[];
    limitation: {
      max_message_length: number;
      max_subscriptions: number;
      max_filters: number;
      max_limit: number;
      max_subid_length: number;
      max_event_tags: number;
      max_content_length: number;
      min_pow_difficulty: number;
      auth_required: boolean;
      payment_required: boolean;
      restricted_writes: boolean;
      created_at_lower_limit?: number;
      created_at_upper_limit?: number;
    };
    retention: [{ time: null }];
  };

  constructor(configService: ConfigService<Config, true>) {
    const relayInfo = configService.get('relayInfo', { infer: true });
    const limitConfig = configService.get('limit', { infer: true });
    const supported_nips = [1, 2, 4, 11, 13, 22, 26, 28, 40];

    const hostname = configService.get('hostname', { infer: true });
    if (hostname) {
      supported_nips.push(42);
    }

    const meiliSearchConfig = configService.get('meiliSearch', { infer: true });
    if (meiliSearchConfig.apiKey && meiliSearchConfig.host) {
      supported_nips.push(50);
    }

    this.relayInfoDoc = {
      name: relayInfo.name,
      version: relayInfo.version,
      description: relayInfo.description,
      pubkey: relayInfo.pubkey,
      contact: relayInfo.contact,
      software: relayInfo.software,
      git_commit_sha: relayInfo.gitCommitSha,
      supported_nips,
      limitation: {
        max_message_length: 128 * 1024, // 128 KB
        max_subscriptions: limitConfig.maxSubscriptionsPerClient ?? 10, // Default to 10 if undefined
        max_filters: 10,
        max_limit: 1000,
        max_subid_length: 128,
        max_event_tags: 2000,
        max_content_length: 102400,
        min_pow_difficulty: limitConfig.minPowDifficulty ?? 0, // Default to 0 if undefined
        auth_required: false,
        payment_required: false,
        restricted_writes: false,
        created_at_lower_limit: limitConfig.createdAtLowerLimit,
        created_at_upper_limit: limitConfig.createdAtUpperLimit,
      },
      retention: [{ time: null }],
    };
  }

  @Get()
  root(@Req() req: Request, @Res() res: Response) {
    if (req.headers.accept === 'application/nostr+json') {
      return res
        .setHeader('content-type', 'application/nostr+json')
        .status(HttpStatus.OK)
        .send(this.relayInfoDoc);
    }

    return res
      .status(HttpStatus.OK)
      .send(
        `Please use a Nostr client to connect. Powered by nostr-relay-nestjs. version: ${this.relayInfoDoc.version} (${this.relayInfoDoc.git_commit_sha})`,
      );
  }
}
