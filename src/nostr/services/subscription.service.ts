import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { LRUCache } from 'lru-cache';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { WebSocket, WebSocketServer } from 'ws';
import { Config } from '../../config';
import { E_EVENT_BROADCAST } from '../constants';
import { Event, Filter } from '../entities';
import { createEventResponse } from '../utils';

@Injectable()
export class SubscriptionService {
  private readonly subscriptionsMap = new WeakMap<
    WebSocket,
    LRUCache<string, Filter[]>
  >();
  private server?: WebSocketServer;
  private readonly maxSubscriptionsPerClient: number;

  constructor(
    @InjectPinoLogger(SubscriptionService.name)
    private readonly logger: PinoLogger,
    configService: ConfigService<Config, true>,
  ) {
    this.maxSubscriptionsPerClient = configService.get(
      'limit.maxSubscriptionsPerClient',
      {
        infer: true,
      },
    );
  }

  setServer(server: WebSocketServer) {
    this.server = server;
  }

  subscribe(client: WebSocket, subscriptionId: string, filters: Filter[]) {
    const subscriptions = this.subscriptionsMap.get(client);
    if (!subscriptions) {
      const lruCache = new LRUCache<string, Filter[]>({
        max: this.maxSubscriptionsPerClient,
      });
      lruCache.set(subscriptionId, filters);
      this.subscriptionsMap.set(client, lruCache);
      return;
    }
    subscriptions.set(subscriptionId, filters);
  }

  unSubscribe(client: WebSocket, subscriptionId: string) {
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
      this.server.clients.forEach((client: WebSocket) => {
        if (client.readyState !== WebSocket.OPEN) {
          return;
        }
        const subscriptions = this.subscriptionsMap.get(client);
        if (!subscriptions) {
          return;
        }
        subscriptions.forEach((filters, subscriptionId) => {
          if (
            !filters.some((filter) => filter.isEventMatching(event)) ||
            !event.checkPermission(client.pubkey)
          ) {
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
