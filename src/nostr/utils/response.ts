import { MessageType } from '../constants';
import { Event } from '../entities';
import { EventDto } from '../interface';
import { EventId, SubscriptionId } from '../interface';

export type CommandResultResponse = [MessageType.OK, EventId, boolean, string];
export function createCommandResultResponse(
  eventId: EventId,
  success: boolean,
  message = '',
): CommandResultResponse {
  return [MessageType.OK, eventId, success, message];
}

export type EventResponse = [MessageType.EVENT, SubscriptionId, EventDto];
export function createEventResponse(
  subscriptionId: SubscriptionId,
  event: Event,
): EventResponse {
  return [MessageType.EVENT, subscriptionId, event.toEventDto()];
}

export type EndOfStoredEventResponse = [MessageType.EOSE, SubscriptionId];
export function createEndOfStoredEventResponse(
  subscriptionId: SubscriptionId,
): EndOfStoredEventResponse {
  return [MessageType.EOSE, subscriptionId];
}

export type NoticeResponse = [MessageType.NOTICE, string];
export function createNoticeResponse(message: string): NoticeResponse {
  return [MessageType.NOTICE, message];
}

export type CountResponse = [
  MessageType.COUNT,
  SubscriptionId,
  { count: number },
];
export function createCountResponse(
  subscriptionId: SubscriptionId,
  count: number,
): CountResponse {
  return [MessageType.COUNT, subscriptionId, { count }];
}
