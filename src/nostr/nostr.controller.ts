import { Controller, Get, HttpStatus, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Config } from '../config';

@Controller()
export class NostrController {
  constructor(private readonly configService: ConfigService<Config, true>) {}

  @Get()
  root(@Req() req: Request, @Res() res: Response) {
    if (req.headers.accept === 'application/nostr+json') {
      const relayInfoDoc = this.configService.get('relayInfoDoc', {
        infer: true,
      });

      return res
        .setHeader('content-type', 'application/nostr+json')
        .setHeader('access-control-allow-origin', '*')
        .status(HttpStatus.OK)
        .send(relayInfoDoc);
    }

    return res
      .status(HttpStatus.OK)
      .send(
        'Please use a Nostr client to connect. Powered by nostr-relay-nestjs.',
      );
  }
}
