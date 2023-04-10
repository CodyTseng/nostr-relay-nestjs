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
  private readonly relayInfoDoc: RelayInfoDoc;

  constructor(configService: ConfigService<Config, true>) {
    this.relayInfoDoc = configService.get('relayInfoDoc', { infer: true });
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
        'Please use a Nostr client to connect. Powered by nostr-relay-nestjs.',
      );
  }

  @Get('.well-known/nostr.json')
  @Header('access-control-allow-origin', '*')
  async nip05(@Query('name') name?: string) {
    if (name !== 'admin') {
      return {};
    }

    const { pubkey } = this.relayInfoDoc;
    if (!pubkey) return {};

    return {
      names: {
        admin: pubkey,
      },
    };
  }
}
