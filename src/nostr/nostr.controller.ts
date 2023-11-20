import {
  Controller,
  Get,
  Header,
  HttpStatus,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Config, RelayInfoDoc } from '../config';

@Controller()
export class NostrController {
  private readonly relayInfoDoc: RelayInfoDoc & { supported_nips: number[] };

  constructor(configService: ConfigService<Config, true>) {
    this.relayInfoDoc = configService.get('relayInfoDoc', { infer: true });
    const supported_nips = [1, 2, 4, 11, 13, 22, 26, 28, 40, 42];

    const meiliSearchConfig = configService.get('meiliSearch', { infer: true });
    if (meiliSearchConfig.apiKey && meiliSearchConfig.host) {
      supported_nips.push(50);
    }

    this.relayInfoDoc.supported_nips = supported_nips.sort((a, b) => a - b);
  }

  @Get()
  root(@Req() req: Request, @Res() res: Response) {
    if (req.headers.accept === 'application/nostr+json') {
      return res
        .setHeader('content-type', 'application/nostr+json')
        .setHeader('access-control-allow-origin', '*')
        .status(HttpStatus.OK)
        .send(this.relayInfoDoc);
    }

    return res
      .status(HttpStatus.OK)
      .send(
        `Please use a Nostr client to connect. Powered by nostr-relay-nestjs. version: ${this.relayInfoDoc.version} (${this.relayInfoDoc.gitCommitSha})`,
      );
  }

  @Get('.well-known/nostr.json')
  @Header('access-control-allow-origin', '*')
  async nip05(@Query('name') name?: string) {
    const { pubkey } = this.relayInfoDoc;
    return name === '_' && pubkey
      ? {
          names: {
            _: pubkey,
          },
        }
      : {};
  }
}
