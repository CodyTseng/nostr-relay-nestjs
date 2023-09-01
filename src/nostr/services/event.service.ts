import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { chain, uniqBy } from 'lodash';
import { E_EVENT_BROADCAST, EventKind, EventType } from '../constants';
import { Event, Filter, SearchFilter } from '../entities';
import { EventRepository } from '../repositories';
import { EventSearchRepository } from '../repositories/event-search.repository';
import { CommandResultResponse, createCommandResultResponse } from '../utils';
import { StorageService } from './storage.service';

@Injectable()
export class EventService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventSearchRepository: EventSearchRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly storageService: StorageService,
  ) {}

  async findByFilters(filters: Filter[]): Promise<Event[]> {
    const { normalFilters, searchFilters } = this.separateFilters(filters);

    const eventsCollection = await Promise.all([
      this.eventRepository.find(normalFilters),
      ...searchFilters.map((searchFilter) =>
        this.eventSearchRepository.find(searchFilter),
      ),
    ]);

    return uniqBy(eventsCollection.flat(), 'id');
  }

  async findTopIds(filters: Filter[]) {
    const { normalFilters, searchFilters } = this.separateFilters(filters);

    const collection = await Promise.all([
      this.eventRepository.findTopIdsWithScore(normalFilters),
      ...searchFilters.map((searchFilter) =>
        this.eventSearchRepository.findTopIdsWithScore(searchFilter),
      ),
    ]);

    return chain(collection)
      .flatten()
      .uniqBy('id')
      .sortBy((item) => -item.score)
      .map('id')
      .take(1000)
      .value();
  }

  async handleEvent(event: Event): Promise<void | CommandResultResponse> {
    switch (event.type) {
      case EventType.REPLACEABLE:
        return this.handleReplaceableEvent(event);
      case EventType.EPHEMERAL:
        return this.handleEphemeralEvent(event);
      case EventType.PARAMETERIZED_REPLACEABLE:
        return this.handleParameterizedReplaceableEvent(event);
      default:
        return this.handleRegularEvent(event);
    }
  }

  private async handleReplaceableEvent(
    event: Event,
  ): Promise<CommandResultResponse> {
    const key = this.getHandleReplaceableEventKey(event);
    const lock = await this.storageService.setNx(key, true);
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
      await this.storageService.del(key);
    }
  }

  private async handleParameterizedReplaceableEvent(event: Event) {
    const key = this.getHandleParameterizedReplaceableEventKey(event);
    const lock = await this.storageService.setNx(key, true);
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
      await this.storageService.del(key);
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

  private separateFilters(filters: Filter[]) {
    const searchFilters: SearchFilter[] = [],
      normalFilters: Filter[] = [];

    filters.forEach((filter) => {
      if (Filter.isSearchFilter(filter)) {
        searchFilters.push(filter);
      } else {
        normalFilters.push(filter);
      }
    });

    return { searchFilters, normalFilters };
  }

  private getHandleReplaceableEventKey(event: Event) {
    return `Lock:${event.pubkey}:${event.kind}`;
  }

  private getHandleParameterizedReplaceableEventKey(event: Event) {
    return `Lock:${event.pubkey}:${event.kind}:${event.dTagValue}`;
  }
}
