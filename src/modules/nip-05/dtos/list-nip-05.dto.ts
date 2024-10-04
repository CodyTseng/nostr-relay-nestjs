export class ListNip05Dto {
  /**
   * Maximum number of NIP-05 identities to return.
   */
  limit?: number;
  /**
   * Return NIP-05 identities after this cursor.
   */
  after?: string;
}
