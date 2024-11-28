import { Event } from '@nostr-relay/common';
export declare function createEvent(params?: {
    kind?: number;
    created_at?: number;
    tags?: string[][];
    content?: string;
    minPowDifficulty?: number;
    targetPowDifficulty?: number;
}): Event;
