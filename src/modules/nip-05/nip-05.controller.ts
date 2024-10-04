import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeEndpoint, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Config } from 'src/config';
import { AdminOnlyGuard } from '../../common/guards';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ErrorVo } from '../../common/vos';
import { Nip05Repository } from '../repositories/nip-05.repository';
import { ListNip05Dto, RegisterNip05Dto } from './dtos';
import { Nip05Entity } from './entities';
import { ListNip05Schema, RegisterNip05Schema } from './schemas';
import { GetNip05Vo, ListNip05Vo } from './vos';

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
  @ApiExcludeEndpoint()
  async nip05(@Query('name') name?: string) {
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
   * (ADMIN ONLY) Register a new NIP-05 identity.
   */
  @Post('api/v1/nip-05')
  @UseGuards(AdminOnlyGuard)
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'NIP-05 identity with this name already exists',
    type: ErrorVo,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid NIP-05 identity',
    type: ErrorVo,
  })
  async register(
    @Body(new ZodValidationPipe(RegisterNip05Schema))
    { name, pubkey }: RegisterNip05Dto,
  ) {
    try {
      await this.nip05Repository.register(name, pubkey);
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException(
          'NIP-05 identity with this name already exists',
        );
      }
    }
  }

  /**
   * Get a NIP-05 identity by name.
   */
  @Get('api/v1/nip-05/:name')
  @ApiResponse({ type: GetNip05Vo })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'NIP-05 identity not found',
    type: ErrorVo,
  })
  async get(@Param('name') name: string): Promise<GetNip05Vo> {
    const row = await this.nip05Repository.getByName(name);
    if (!row) {
      throw new NotFoundException('NIP-05 identity not found');
    }
    return { data: new Nip05Entity(row) };
  }

  /**
   * List NIP-05 identities.
   */
  @Get('api/v1/nip-05')
  @ApiResponse({ type: ListNip05Vo })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
    type: ErrorVo,
  })
  async list(
    @Query(new ZodValidationPipe(ListNip05Schema))
    { limit, after }: ListNip05Dto,
  ): Promise<ListNip05Vo> {
    const rows = await this.nip05Repository.list(limit, after);
    return { data: rows.map((row) => new Nip05Entity(row)) };
  }

  /**
   * (ADMIN ONLY) Delete a NIP-05 identity by name.
   */
  @Delete('api/v1/nip-05/:name')
  @UseGuards(AdminOnlyGuard)
  async delete(@Param('name') name: string) {
    await this.nip05Repository.delete(name);
  }
}
