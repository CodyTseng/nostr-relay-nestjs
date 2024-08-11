import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindEventsDto, HandleEventDto, RequestEventsDto } from './dtos';
import { EventEntity, FilterEntity } from './entities';
import { EventIdSchema } from './schemas';
import { NostrRelayService } from './services/nostr-relay.service';
import {
  ErrorVo,
  FindEventByIdVo,
  FindEventsVo,
  HandleEventVo,
  RequestEventsVo,
} from './vos';

@Controller('api/v1/events')
@ApiTags('events')
export class EventController {
  constructor(private readonly nostrRelayService: NostrRelayService) {}

  /**
   * Handle a new event.
   */
  @Post()
  @ApiResponse({ type: HandleEventVo })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid event',
    type: ErrorVo,
  })
  async handleEvent(
    @Body() handleEventDto: HandleEventDto,
  ): Promise<HandleEventVo> {
    let event: EventEntity;
    try {
      event = await this.nostrRelayService.validateEvent(handleEventDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const { success, message = '' } =
      await this.nostrRelayService.handleEvent(event);
    if (!success) {
      throw new BadRequestException(message);
    }

    return { message };
  }

  /**
   * Find an event by its ID.
   */
  @Get(':id')
  @ApiResponse({ type: FindEventByIdVo })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid event ID',
    type: ErrorVo,
  })
  async findEventById(@Param('id') id: string): Promise<FindEventByIdVo> {
    const { success: validateSuccess } = await EventIdSchema.safeParseAsync(id);
    if (!validateSuccess) {
      throw new BadRequestException('Invalid event ID');
    }

    const [event] = await this.nostrRelayService
      .findEvents([{ ids: [id] }])
      .catch(() => []);

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return { data: event };
  }

  /**
   * Find events based on a filter.
   */
  @Get()
  @ApiResponse({ type: FindEventsVo })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid filters',
    type: ErrorVo,
  })
  async findEvents(
    @Query() findEventsDto: FindEventsDto,
  ): Promise<FindEventsVo> {
    let filter: FilterEntity = {};
    try {
      filter = await this.nostrRelayService.validateFilter(
        this.preprocessFindEventsDto(findEventsDto),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }

    const events = await this.nostrRelayService
      .findEvents([filter])
      .catch(() => []);
    return { data: events };
  }

  /**
   * Request events based on filters.
   */
  @Post('request')
  @ApiResponse({ type: RequestEventsVo })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid filters',
    type: ErrorVo,
  })
  async requestEvents(
    @Body() requestEventsDto: RequestEventsDto,
  ): Promise<RequestEventsVo> {
    let filters: FilterEntity[] = [];
    if (requestEventsDto.filters) {
      try {
        filters = await this.nostrRelayService.validateFilters(
          requestEventsDto.filters,
        );
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    }
    if (filters.length === 0) {
      filters.push({});
    }

    const events = await this.nostrRelayService
      .findEvents(filters)
      .catch(() => []);
    return { data: events };
  }

  private preprocessFindEventsDto(findEventsDto: FindEventsDto) {
    const filter: FilterEntity = {};
    Object.keys(findEventsDto)
      .filter(
        (key) =>
          [
            'ids',
            'authors',
            'kinds',
            'since',
            'until',
            'limit',
            'search',
          ].includes(key) || !!key.match(/^[a-zA-Z]$/),
      )
      .forEach((key) => {
        let value = findEventsDto[key];
        // skip empty arrays or strings
        if (value.length === 0) {
          return;
        }
        if (
          !['since', 'until', 'limit', 'search'].includes(key) &&
          !Array.isArray(value)
        ) {
          value = value.split(',');
        }
        if (['kinds', 'since', 'until', 'limit'].includes(key)) {
          value = Array.isArray(value)
            ? value.map((v) => parseInt(v))
            : parseInt(value);
        }
        filter[key.match(/^[a-zA-Z]$/) ? `#${key}` : key] = value;
      });

    return filter;
  }
}
