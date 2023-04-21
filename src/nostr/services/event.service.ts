import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { difference, union } from 'lodash';
import { EventType, E_EVENT_BROADCAST, TagName } from '../constants';
import { Event, Filter } from '../entities';
import { EventRepository } from '../repositories';
import { EventIdSchema } from '../schemas';
import { CommandResultResponse, createCommandResultResponse } from '../utils';
import { LockService } from './lock.service';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly lockService: LockService,
  ) {}

  async findByFilters(filters: Filter[]): Promise<Event[]> {
    return await this.eventRepository.find(filters);
  }

  async countByFilters(filters: Filter[]): Promise<number> {
    return await this.eventRepository.count(filters);
  }

  async handleEvent(event: Event): Promise<void | CommandResultResponse> {
    switch (event.type) {
      case EventType.REPLACEABLE:
        return this.handleReplaceableEvent(event);
      case EventType.EPHEMERAL:
        return this.handleEphemeralEvent(event);
      case EventType.DELETION:
        return this.handleDeletionEvent(event);
      case EventType.PARAMETERIZED_REPLACEABLE:
        return this.handleParameterizedReplaceableEvent(event);
      default:
        return this.handleRegularEvent(event);
    }
  }

  private async handleDeletionEvent(event: Event) {
    const eventIds = union(
      event.tags
        .filter(
          ([tagName, tagValue]) =>
            tagName === TagName.EVENT &&
            EventIdSchema.safeParse(tagValue).success,
        )
        .map(([, tagValue]) => tagValue),
    );

    if (eventIds.length > 0) {
      const events = await this.eventRepository.find({ ids: eventIds });
      const eventIdsNotBelongToPubkey = events
        .filter(
          (item) => ![event.pubkey, event.delegator].includes(item.pubkey),
        )
        .map((item) => item.id);

      const eventIdsToBeDeleted = difference(
        eventIds,
        eventIdsNotBelongToPubkey,
      );
      await this.eventRepository.delete(event.pubkey, eventIdsToBeDeleted);
    }

    return this.handleRegularEvent(event);
  }

  private async handleReplaceableEvent(
    event: Event,
  ): Promise<CommandResultResponse> {
    const key = this.lockService.getHandleReplaceableEventKey(event);
    const lock = await this.lockService.acquireLock(key);
    if (!lock) {
      return createCommandResultResponse(
        event.id,
        false,
        'rate-limited: slow down there chief',
      );
    }

    try {
      const oldEvent = await this.eventRepository.findOne({
        authors: [event.pubkey],
        kinds: [event.kind],
      });
      return await this.replaceEvent(event, oldEvent);
    } finally {
      await this.lockService.releaseLock(key);
    }
  }

  private async handleParameterizedReplaceableEvent(event: Event) {
    const key =
      this.lockService.getHandleParameterizedReplaceableEventKey(event);
    const lock = await this.lockService.acquireLock(key);
    if (!lock) {
      return createCommandResultResponse(
        event.id,
        false,
        'rate-limited: slow down there chief',
      );
    }

    try {
      const oldEvent = await this.eventRepository.findOne({
        authors: [event.pubkey],
        kinds: [event.kind],
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        dTagValues: [event.dTagValue!],
      });
      return await this.replaceEvent(event, oldEvent);
    } finally {
      await this.lockService.releaseLock(key);
    }
  }

  private handleEphemeralEvent(event: Event): void {
    this.broadcastEvent(event);
  }

  private async handleRegularEvent(
    event: Event,
  ): Promise<CommandResultResponse> {
    const success = await this.eventRepository.create(event);

    if (success) {
      this.broadcastEvent(event);
    }
    return createCommandResultResponse(
      event.id,
      true,
      success ? '' : 'duplicate: the event already exists',
    );
  }

  private async replaceEvent(
    event: Event,
    oldEvent: Event | null,
  ): Promise<CommandResultResponse> {
    if (oldEvent && oldEvent.created_at > event.created_at) {
      return createCommandResultResponse(
        event.id,
        true,
        'duplicate: the event already exists',
      );
    }

    const success = await this.eventRepository.replace(event, oldEvent?.id);
    if (success) {
      this.broadcastEvent(event);
    }
    return createCommandResultResponse(
      event.id,
      true,
      success ? '' : 'duplicate: the event already exists',
    );
  }

  private broadcastEvent(event: Event) {
    return this.eventEmitter.emit(E_EVENT_BROADCAST, event);
  }
}
