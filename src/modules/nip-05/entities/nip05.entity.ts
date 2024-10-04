import { Nip05Row } from '../../../modules/repositories/types';

export class Nip05Entity {
  /**
   * NIP-05 identity name.
   */
  name: string;

  /**
   * NIP-05 identity pubkey.
   */
  pubkey: string;

  /**
   * NIP-05 identity created at timestamp in milliseconds.
   */
  created_at: number;

  constructor(raw: Nip05Row) {
    this.name = raw.name;
    this.pubkey = raw.pubkey;
    this.created_at = raw.create_date.getTime();
  }
}
