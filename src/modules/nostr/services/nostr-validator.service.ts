import { Injectable } from '@nestjs/common';
import { Validator } from '@nostr-relay/validator';
import { Event, Filter } from '@nostr-relay/common';

@Injectable()
export class NostrValidatorService {
  private readonly validator: Validator;

  constructor() {
    this.validator = new Validator();
  }

  async validateEvent(event: any): Promise<Event> {
    return await this.validator.validateEvent(event);
  }

  async validateFilters(filters: any): Promise<Filter[]> {
    return await this.validator.validateFilters(filters);
  }

  async validateIncomingMessage(message: any): Promise<any[]> {
    return await this.validator.validateIncomingMessage(message);
  }

  async validateFilter(filter: any): Promise<Filter> {
    return await this.validator.validateFilter(filter);
  }
}
