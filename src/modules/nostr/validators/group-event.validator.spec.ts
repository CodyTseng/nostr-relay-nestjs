import { Test, TestingModule } from '@nestjs/testing';
import { Event } from '@nostr-relay/common';
import { EventKind } from '../constants/event-kinds';
import { GroupEventValidator } from './group-event.validator';

describe('GroupEventValidator', () => {
  let validator: GroupEventValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupEventValidator],
    }).compile();

    validator = module.get<GroupEventValidator>(GroupEventValidator);
  });

  const createTestEvent = (kind: EventKind, content: string, tags: string[][]): Event => ({
    id: 'test-id',
    pubkey: 'test-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind,
    tags,
    content,
    sig: 'test-sig',
  });

  describe('validate', () => {
    it('should return null for non-group events', () => {
      const event = createTestEvent(EventKind.TEXT_NOTE, 'test', []);
      expect(validator.validate(event)).toBeNull();
    });

    it('should validate group create events', () => {
      // Valid event
      const validEvent = createTestEvent(
        EventKind.GROUP_CREATE,
        JSON.stringify({ name: 'Test Group' }),
        [['p', 'member1-pubkey']],
      );
      expect(validator.validate(validEvent)).toBeNull();

      // Invalid JSON
      const invalidJsonEvent = createTestEvent(
        EventKind.GROUP_CREATE,
        'invalid json',
        [['p', 'member1-pubkey']],
      );
      expect(validator.validate(invalidJsonEvent)).toBe('Group create event content must be valid JSON');

      // Missing name
      const missingNameEvent = createTestEvent(
        EventKind.GROUP_CREATE,
        JSON.stringify({}),
        [['p', 'member1-pubkey']],
      );
      expect(validator.validate(missingNameEvent)).toBe('Group create event must contain a name in content');

      // Missing members
      const missingMembersEvent = createTestEvent(
        EventKind.GROUP_CREATE,
        JSON.stringify({ name: 'Test Group' }),
        [],
      );
      expect(validator.validate(missingMembersEvent)).toBe('Group create event must contain at least one "p" tag for initial members');
    });

    it('should validate group metadata events', () => {
      // Valid event
      const validEvent = createTestEvent(
        EventKind.GROUP_METADATA,
        JSON.stringify({ name: 'Updated Group Name' }),
        [['e', 'group-event-id']],
      );
      expect(validator.validate(validEvent)).toBeNull();

      // Invalid JSON
      const invalidJsonEvent = createTestEvent(
        EventKind.GROUP_METADATA,
        'invalid json',
        [['e', 'group-event-id']],
      );
      expect(validator.validate(invalidJsonEvent)).toBe('Group metadata event content must be valid JSON');

      // Missing group reference
      const missingRefEvent = createTestEvent(
        EventKind.GROUP_METADATA,
        JSON.stringify({ name: 'Updated Group Name' }),
        [],
      );
      expect(validator.validate(missingRefEvent)).toBe('Group metadata event must reference the group creation event with an "e" tag');
    });

    it('should validate group message events', () => {
      // Valid event
      const validEvent = createTestEvent(
        EventKind.GROUP_MESSAGE,
        'Hello group!',
        [['e', 'group-event-id']],
      );
      expect(validator.validate(validEvent)).toBeNull();

      // Missing group reference
      const missingRefEvent = createTestEvent(
        EventKind.GROUP_MESSAGE,
        'Hello group!',
        [],
      );
      expect(validator.validate(missingRefEvent)).toBe('Group message event must reference the group with an "e" tag');
    });

    it('should validate group member approval events', () => {
      // Valid event
      const validEvent = createTestEvent(
        EventKind.GROUP_MEMBER_APPROVAL,
        'Approved',
        [
          ['e', 'group-event-id'],
          ['p', 'member-pubkey'],
        ],
      );
      expect(validator.validate(validEvent)).toBeNull();

      // Missing group reference
      const missingGroupRefEvent = createTestEvent(
        EventKind.GROUP_MEMBER_APPROVAL,
        'Approved',
        [['p', 'member-pubkey']],
      );
      expect(validator.validate(missingGroupRefEvent)).toBe('Group member approval event must reference the group with an "e" tag');

      // Missing member reference
      const missingMemberRefEvent = createTestEvent(
        EventKind.GROUP_MEMBER_APPROVAL,
        'Approved',
        [['e', 'group-event-id']],
      );
      expect(validator.validate(missingMemberRefEvent)).toBe('Group member approval event must contain a "p" tag for the approved member');
    });

    it('should validate group invite events', () => {
      // Valid event
      const validEvent = createTestEvent(
        EventKind.GROUP_INVITE,
        'You are invited!',
        [
          ['e', 'group-event-id'],
          ['p', 'invitee-pubkey'],
        ],
      );
      expect(validator.validate(validEvent)).toBeNull();

      // Missing group reference
      const missingGroupRefEvent = createTestEvent(
        EventKind.GROUP_INVITE,
        'You are invited!',
        [['p', 'invitee-pubkey']],
      );
      expect(validator.validate(missingGroupRefEvent)).toBe('Group invite event must reference the group with an "e" tag');

      // Missing invitee reference
      const missingInviteeRefEvent = createTestEvent(
        EventKind.GROUP_INVITE,
        'You are invited!',
        [['e', 'group-event-id']],
      );
      expect(validator.validate(missingInviteeRefEvent)).toBe('Group invite event must contain a "p" tag for the invited member');
    });
  });
});
