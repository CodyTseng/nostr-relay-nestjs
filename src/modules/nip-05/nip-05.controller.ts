import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Config } from 'src/config';

@Controller()
@ApiTags('nip-05')
export class Nip05Controller {
  private readonly adminPubkey?: string;

  constructor(configService: ConfigService<Config, true>) {
    this.adminPubkey = configService.get('relayInfo.pubkey', {
      infer: true,
    });
  }

  @Get('.well-known/nostr.json')
  async nip05(@Query('name') name?: string) {
    return name === '_' && this.adminPubkey
      ? {
          names: {
            _: this.adminPubkey,
          },
        }
      : {};
  }
}
