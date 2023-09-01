import { MessageType } from '../constants';
import { Event } from '../entities';
import { EventDto } from '../schemas';

export type CommandResultResponse = [MessageType.OK, string, boolean, string];
export function createCommandResultResponse(
  eventId: string,
  success: boolean,
  message = '',
): CommandResultResponse {
  return [MessageType.OK, eventId, success, message];
}

export type EventResponse = [MessageType.EVENT, string, EventDto];
export function createEventResponse(
  subscriptionId: string,
  event: Event,
): EventResponse {
  return [MessageType.EVENT, subscriptionId, event.toEventDto()];
}

export type EndOfStoredEventResponse = [MessageType.EOSE, string];
export function createEndOfStoredEventResponse(
  subscriptionId: string,
): EndOfStoredEventResponse {
  return [MessageType.EOSE, subscriptionId];
}

export type NoticeResponse = [MessageType.NOTICE, string];
export function createNoticeResponse(message: string): NoticeResponse {
  return [MessageType.NOTICE, message];
}

export type AuthResponse = [MessageType.AUTH, string];
export function createAuthResponse(challenge: string) {
  return [MessageType.AUTH, challenge];
}

export type TopResponse = [MessageType.TOP, string, string[]];
export function createTopResponse(
  subscriptionId: string,
  ids: string[],
): TopResponse {
  return [MessageType.TOP, subscriptionId, ids];
}
