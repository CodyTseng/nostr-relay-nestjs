import { MessageType } from '../constants';
import { EventId, Event, SubscriptionId } from '../schemas';

export type CommandResultResponse = [MessageType.OK, EventId, boolean, string];
export function createCommandResultResponse(
  eventId: EventId,
  success: boolean,
  message = '',
): CommandResultResponse {
  return [MessageType.OK, eventId, success, message];
}

export type EventResponse = [MessageType.EVENT, SubscriptionId, Event];
export function createEventResponse(
  subscriptionId: SubscriptionId,
  event: Event,
): EventResponse {
  return [MessageType.EVENT, subscriptionId, event];
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
