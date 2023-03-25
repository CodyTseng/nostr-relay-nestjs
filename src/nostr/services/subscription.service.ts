import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { WebSocket, WebSocketServer } from 'ws';
import { E_EVENT_BROADCAST } from '../constants';
import { Event, Filter, SubscriptionId } from '../schemas';
import { createEventResponse, isEventMatchingFilter } from '../utils';

@Injectable()
export class SubscriptionService {
  private readonly subscriptionsMap = new WeakMap<
    WebSocket,
    Map<SubscriptionId, Filter[]>
  >();
  private server?: WebSocketServer;

  constructor(
    @InjectPinoLogger(SubscriptionService.name)
    private readonly logger: PinoLogger,
  ) {}

  setServer(server: WebSocketServer) {
    this.server = server;
  }

  subscribe(
    client: WebSocket,
    subscriptionId: SubscriptionId,
    filters: Filter[],
  ) {
    const subscriptions = this.subscriptionsMap.get(client);
    if (!subscriptions) {
      this.subscriptionsMap.set(client, new Map([[subscriptionId, filters]]));
      return;
    }
    subscriptions.set(subscriptionId, filters);
  }

  unSubscribe(client: WebSocket, subscriptionId: SubscriptionId) {
    const subscriptions = this.subscriptionsMap.get(client);
    if (!subscriptions) {
      return false;
    }
    return subscriptions.delete(subscriptionId);
  }

  clear(client: WebSocket) {
    return this.subscriptionsMap.delete(client);
  }

  @OnEvent(E_EVENT_BROADCAST, { async: true })
  broadcast(event: Event) {
    try {
      if (!this.server) {
        throw new Error('WebSocketServer not found');
      }
      this.server.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) {
          return;
        }
        const subscriptions = this.subscriptionsMap.get(client);
        if (!subscriptions) {
          return;
        }
        subscriptions.forEach((filters, subscriptionId) => {
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
