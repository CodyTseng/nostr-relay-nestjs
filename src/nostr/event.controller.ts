import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { HandleEventDto, RequestEventsDto } from './dtos';
import { EventEntity, FilterEntity } from './entities';
import { EventIdSchema } from './schemas';
import { NostrRelayService } from './services/nostr-relay.service';
import { ErrorVo, GetEventByIdVo, RequestEventsVo } from './vos';
import { HandleEventVo } from './vos/handle-event.vo';

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
   * Get an event by its ID.
   */
  @Get(':id')
  @ApiResponse({ type: GetEventByIdVo })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Event not found' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid event ID',
    type: ErrorVo,
  })
  async getEventById(@Param('id') id: string): Promise<GetEventByIdVo> {
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
}
