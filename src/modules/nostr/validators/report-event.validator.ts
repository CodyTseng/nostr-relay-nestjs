import { Injectable } from '@nestjs/common';
import { Event } from '@nostr-relay/common';
import { EventKind } from '../constants/event-kinds';

@Injectable()
export class ReportEventValidator {
  validate(event: Event): string | null {
    if (event.kind !== EventKind.REPORT) {
      return null;
    }

    // Validate required tags
    const eTags = event.tags.filter(([tagName]) => tagName === 'e');
    if (eTags.length === 0) {
      return 'Report event must contain at least one "e" tag referencing the reported event';
    }

    const pTags = event.tags.filter(([tagName]) => tagName === 'p');
    if (pTags.length === 0) {
      return 'Report event must contain at least one "p" tag referencing the reported pubkey';
    }

    // Validate optional k tag if present
    const kTags = event.tags.filter(([tagName]) => tagName === 'k');
    for (const [, value] of kTags) {
      const kind = parseInt(value);
      if (isNaN(kind)) {
        return 'Invalid "k" tag value: must be a valid event kind number';
      }
    }

    // Validate content (reason)
    if (!event.content || event.content.trim().length === 0) {
      return 'Report event must contain a reason in the content field';
    }

    return null;
  }
}
