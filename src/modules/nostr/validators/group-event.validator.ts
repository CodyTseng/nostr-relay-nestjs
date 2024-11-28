import { Injectable } from '@nestjs/common';
import { Event } from '@nostr-relay/common';
import { EventKind } from '../constants/event-kinds';

@Injectable()
export class GroupEventValidator {
  validate(event: Event): string | null {
    // Check if this is a group event
    if (
      ![
        EventKind.GROUP_CREATE,
        EventKind.GROUP_METADATA,
        EventKind.GROUP_MESSAGE,
        EventKind.GROUP_MEMBER_APPROVAL,
        EventKind.GROUP_INVITE,
      ].includes(event.kind)
    ) {
      return null;
    }

    // Common validation for all group events
    if (!event.content) {
      return 'Group events must contain content';
    }

    // Specific validation based on event kind
    switch (event.kind) {
      case EventKind.GROUP_CREATE:
        return this.validateGroupCreate(event);
      case EventKind.GROUP_METADATA:
        return this.validateGroupMetadata(event);
      case EventKind.GROUP_MESSAGE:
        return this.validateGroupMessage(event);
      case EventKind.GROUP_MEMBER_APPROVAL:
        return this.validateGroupMemberApproval(event);
      case EventKind.GROUP_INVITE:
        return this.validateGroupInvite(event);
      default:
        return null;
    }
  }

  private validateGroupCreate(event: Event): string | null {
    try {
      const metadata = JSON.parse(event.content);
      if (!metadata.name) {
        return 'Group create event must contain a name in content';
      }
      
      // Validate required tags
      const pTags = event.tags.filter(([tagName]) => tagName === 'p');
      if (pTags.length === 0) {
        return 'Group create event must contain at least one "p" tag for initial members';
      }

      return null;
    } catch (e) {
      return 'Group create event content must be valid JSON';
    }
  }

  private validateGroupMetadata(event: Event): string | null {
    try {
      const metadata = JSON.parse(event.content);
      if (!metadata.name) {
        return 'Group metadata event must contain a name in content';
      }

      // Validate group reference
      const eTags = event.tags.filter(([tagName]) => tagName === 'e');
      if (eTags.length === 0) {
        return 'Group metadata event must reference the group creation event with an "e" tag';
      }

      return null;
    } catch (e) {
      return 'Group metadata event content must be valid JSON';
    }
  }

  private validateGroupMessage(event: Event): string | null {
    // Validate group reference
    const eTags = event.tags.filter(([tagName]) => tagName === 'e');
    if (eTags.length === 0) {
      return 'Group message event must reference the group with an "e" tag';
    }

    // Content is already validated in the main validate function
    return null;
  }

  private validateGroupMemberApproval(event: Event): string | null {
    // Validate group reference
    const eTags = event.tags.filter(([tagName]) => tagName === 'e');
    if (eTags.length === 0) {
      return 'Group member approval event must reference the group with an "e" tag';
    }

    // Validate member pubkey
    const pTags = event.tags.filter(([tagName]) => tagName === 'p');
    if (pTags.length === 0) {
      return 'Group member approval event must contain a "p" tag for the approved member';
    }

    return null;
  }

  private validateGroupInvite(event: Event): string | null {
    // Validate group reference
    const eTags = event.tags.filter(([tagName]) => tagName === 'e');
    if (eTags.length === 0) {
      return 'Group invite event must reference the group with an "e" tag';
    }

    // Validate invited member pubkey
    const pTags = event.tags.filter(([tagName]) => tagName === 'p');
    if (pTags.length === 0) {
      return 'Group invite event must contain a "p" tag for the invited member';
    }

    return null;
  }
}
