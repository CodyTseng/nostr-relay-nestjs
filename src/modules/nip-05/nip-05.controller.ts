import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { Config } from 'src/config';
import { AdminOnlyGuard } from '../../common/guards';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Nip05Repository } from '../repositories/nip-05.repository';
import { RegisterNip05Dto } from './dtos';
import { RegisterNip05Schema } from './schemas';

@Controller()
@ApiTags('nip-05')
export class Nip05Controller {
  private readonly adminPubkey?: string;

  constructor(
    configService: ConfigService<Config, true>,
    private readonly nip05Repository: Nip05Repository,
  ) {
    this.adminPubkey = configService.get('relayInfo.pubkey', {
      infer: true,
    });
  }

  @Get('.well-known/nostr.json')
  async get(@Query('name') name?: string) {
    if (!name) {
      return {};
    }

    if (name === '_' && this.adminPubkey) {
      return {
        names: {
          _: this.adminPubkey,
        },
      };
    }

    const pubkey = await this.nip05Repository.getPubkeyByName(name);
    return pubkey
      ? {
          names: {
            [name]: pubkey,
          },
        }
      : {};
  }

  /**
   * Register a new NIP-05 identity.
   */
  @Post('api/v1/nip-05')
  @UseGuards(AdminOnlyGuard)
  async register(
    @Body(new ZodValidationPipe(RegisterNip05Schema))
    { name, pubkey }: RegisterNip05Dto,
  ) {
    await this.nip05Repository.register(name, pubkey);
  }

  /**
   * Delete a NIP-05 identity by name.
   */
  @Delete('api/v1/nip-05/:name')
  @UseGuards(AdminOnlyGuard)
  async delete(@Param('name') name: string) {
    await this.nip05Repository.delete(name);
  }
}
