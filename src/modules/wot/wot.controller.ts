import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { nip19 } from 'nostr-tools';
import { CheckPubkeyTrustedVo } from './vos';
import { WotService } from './wot.service';

@Controller('api/v1/wot')
@ApiTags('wot')
export class WotController {
  constructor(private readonly wotService: WotService) {}

  /**
   * Check if a pubkey is trusted.
   */
  @Get('trusted/:pubkey')
  trusted(@Param('pubkey') pubkey: string): CheckPubkeyTrustedVo {
    if (pubkey.startsWith('npub')) {
      try {
        const { data } = nip19.decode(pubkey);
        pubkey = data as string;
      } catch {
        throw new BadRequestException('Invalid pubkey');
      }
    }
    if (!/^[0-9a-f]{64}$/.test(pubkey)) {
      throw new BadRequestException('Invalid pubkey');
    }
    const isTrusted = this.wotService.checkPubkeyIsTrusted(pubkey);
    return { data: isTrusted };
  }
}
