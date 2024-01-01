import { Event } from '@nostr-relay/common';
import { EventEntity } from './event.entity';

describe('EventEntity', () => {
  describe('fromEvent', () => {
    it('should create a new EventEntity from an Event', () => {
      const event: Event = {
        id: 'testId',
        pubkey: 'testPubkey',
        created_at: 123456,
        kind: 30023,
        tags: [
          ['testTag', 'testValue'],
          ['d', 'test'],
        ],
        content: 'testContent',
        sig: 'testSig',
      };

      const result = EventEntity.fromEvent(event);

      expect(result.id).toEqual(event.id);
      expect(result.pubkey).toEqual(event.pubkey);
      expect(result.createdAt).toEqual(event.created_at);
      expect(result.kind).toEqual(event.kind);
      expect(result.tags).toEqual(event.tags);
      expect(result.content).toEqual(event.content);
      expect(result.sig).toEqual(event.sig);
      expect(result.author).toEqual(event.pubkey);
      expect(result.expiredAt).toBeNull();
      expect(result.dTagValue).toEqual('test');
      expect(result.genericTags).toEqual(['d:test']);
    });
  });

  describe('toEvent', () => {
    it('should convert an EventEntity to an Event', () => {
      const event: Event = {
        id: 'testId',
        pubkey: 'testPubkey',
        created_at: 123456,
        kind: 30023,
        tags: [
          ['testTag', 'testValue'],
          ['d', 'test'],
        ],
        content: 'testContent',
        sig: 'testSig',
      };

      expect(EventEntity.fromEvent(event).toEvent()).toEqual(event);
    });
  });
});
