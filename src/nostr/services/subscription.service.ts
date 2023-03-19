import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { WebSocket } from 'ws';
import { E_EVENT_BROADCAST } from '../constants';
import { Event, Filter, SubscriptionId } from '../schemas';
import { createEventResponse, isEventMatchingFilter } from '../utils';

@Injectable()
export class SubscriptionService {
  private readonly subscriptionsMap = new Map<
    WebSocket,
    Map<SubscriptionId, Filter[]>
  >();

  constructor(
    @InjectPinoLogger(SubscriptionService.name)
    private readonly logger: PinoLogger,
  ) {}

  subscribe(
    client: WebSocket,
    subscriptionId: SubscriptionId,
    filters: Filter[],
  ) {
    let subscriptions = this.subscriptionsMap.get(client);
    if (!subscriptions) {
      subscriptions = new Map();
    }
    subscriptions.set(subscriptionId, filters);
    return this.subscriptionsMap.set(client, subscriptions);
  }

  unSubscribe(client: WebSocket, subscriptionId: SubscriptionId) {
    const subscriptions = this.subscriptionsMap.get(client);
    if (!subscriptions) {
      return;
    }
    subscriptions.delete(subscriptionId);
    return this.subscriptionsMap.set(client, subscriptions);
  }

  clear(client: WebSocket) {
    return this.subscriptionsMap.delete(client);
  }

  @OnEvent(E_EVENT_BROADCAST, { async: true })
  broadcast(event: Event) {
    try {
      this.subscriptionsMap.forEach((clientSubscriptions, client) => {
        if (client.readyState !== WebSocket.OPEN) {
          return;
        }
        clientSubscriptions.forEach((filters, subscriptionId) => {
          if (!filters.some((filter) => isEventMatchingFilter(event, filter))) {
            return;
          }
          client.send(
            JSON.stringify(createEventResponse(subscriptionId, event)),
          );
        });
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
