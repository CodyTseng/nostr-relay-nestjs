import { Test, TestingModule } from '@nestjs/testing';
import { Event } from '@nostr-relay/common';
import { EventKind } from '../constants/event-kinds';
import { ReportEventValidator } from './report-event.validator';

describe('ReportEventValidator', () => {
  let validator: ReportEventValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportEventValidator],
    }).compile();

    validator = module.get<ReportEventValidator>(ReportEventValidator);
  });

  const createValidReportEvent = (): Event => ({
    id: 'test-id',
    pubkey: 'test-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind: EventKind.REPORT,
    tags: [
      ['e', 'reported-event-id'],
      ['p', 'reported-pubkey'],
    ],
    content: 'This is a report reason',
    sig: 'test-sig',
  });

  describe('validate', () => {
    it('should return null for non-report events', () => {
      const event = {
        ...createValidReportEvent(),
        kind: EventKind.TEXT_NOTE,
      };
      expect(validator.validate(event)).toBeNull();
    });

    it('should validate a valid report event', () => {
      const event = createValidReportEvent();
      expect(validator.validate(event)).toBeNull();
    });

    it('should validate a report event with k tag', () => {
      const event = {
        ...createValidReportEvent(),
        tags: [
          ['e', 'reported-event-id'],
          ['p', 'reported-pubkey'],
          ['k', '1'],
        ],
      };
      expect(validator.validate(event)).toBeNull();
    });

    it('should reject event without e tag', () => {
      const event = {
        ...createValidReportEvent(),
        tags: [['p', 'reported-pubkey']],
      };
      expect(validator.validate(event)).toBe(
        'Report event must contain at least one "e" tag referencing the reported event',
      );
    });

    it('should reject event without p tag', () => {
      const event = {
        ...createValidReportEvent(),
        tags: [['e', 'reported-event-id']],
      };
      expect(validator.validate(event)).toBe(
        'Report event must contain at least one "p" tag referencing the reported pubkey',
      );
    });

    it('should reject event with invalid k tag', () => {
      const event = {
        ...createValidReportEvent(),
        tags: [
          ['e', 'reported-event-id'],
          ['p', 'reported-pubkey'],
          ['k', 'invalid'],
        ],
      };
      expect(validator.validate(event)).toBe(
        'Invalid "k" tag value: must be a valid event kind number',
      );
    });

    it('should reject event with empty content', () => {
      const event = {
        ...createValidReportEvent(),
        content: '',
      };
      expect(validator.validate(event)).toBe(
        'Report event must contain a reason in the content field',
      );
    });

    it('should reject event with whitespace-only content', () => {
      const event = {
        ...createValidReportEvent(),
        content: '   ',
      };
      expect(validator.validate(event)).toBe(
        'Report event must contain a reason in the content field',
      );
    });
  });
});
