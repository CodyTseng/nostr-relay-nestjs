import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { difference, union, uniqBy } from 'lodash';
import { EventKind, EventType, E_EVENT_BROADCAST, TagName } from '../constants';
import { Event, Filter, SearchFilter } from '../entities';
import { EventRepository } from '../repositories';
import { EventSearchRepository } from '../repositories/event-search.repository';
import { EventIdSchema } from '../schemas';
import { CommandResultResponse, createCommandResultResponse } from '../utils';
import { LockService } from './lock.service';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventSearchRepository: EventSearchRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly lockService: LockService,
  ) {}

  async findByFilters(filters: Filter[]): Promise<Event[]> {
    const searchFilters: SearchFilter[] = [],
      normalFilters: Filter[] = [];

    filters.forEach((filter) => {
      if (Filter.isSearchFilter(filter)) {
        searchFilters.push(filter);
      } else {
        normalFilters.push(filter);
      }
    });

    const eventsCollection = await Promise.all([
      this.eventRepository.find(normalFilters),
      ...searchFilters.map((searchFilter) =>
        this.eventSearchRepository.find(searchFilter),
      ),
    ]);

    return uniqBy(eventsCollection.flat(), 'id');
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
        .filter((item) => ![item.pubkey, item.delegator].includes(event.pubkey))
        .map((item) => item.id);

      const eventIdsToBeDeleted = difference(
        eventIds,
        eventIdsNotBelongToPubkey,
      );
      await Promise.all([
        this.eventRepository.delete(eventIdsToBeDeleted),
        this.eventSearchRepository.deleteMany(eventIdsToBeDeleted),
      ]);
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
    if (event.kind === EventKind.AUTHENTICATION) {
      return;
    }
    this.broadcastEvent(event);
  }

  private async handleRegularEvent(
    event: Event,
  ): Promise<CommandResultResponse> {
    const [success] = await Promise.all([
      this.eventRepository.create(event),
      this.eventSearchRepository.add(event),
    ]);

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
    if (oldEvent && oldEvent.createdAt > event.createdAt) {
      return createCommandResultResponse(
        event.id,
        true,
        'duplicate: the event already exists',
      );
    }

    const [success] = await Promise.all([
      this.eventRepository.replace(event, oldEvent?.id),
      this.eventSearchRepository.replace(event, oldEvent?.id),
    ]);
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
