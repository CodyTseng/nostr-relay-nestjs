import 'dotenv/config';
import { getPgClient, getMeiliSearchClient } from './utils';
import Pino from 'pino';

async function run() {
  const logger = Pino();
  const pg = await getPgClient();
  const meiliSearch = getMeiliSearchClient();

  const eventIndex = meiliSearch.index('events');

  eventIndex.updateSettings({
    displayedAttributes: [
      'id',
      'pubkey',
      'createdAt',
      'kind',
      'tags',
      'content',
      'sig',
    ],
    searchableAttributes: ['content'],
    filterableAttributes: [
      'pubkey',
      'createdAt',
      'kind',
      'genericTags',
      'delegator',
      'expiredAt',
    ],
    sortableAttributes: ['createdAt'],
    rankingRules: [
      'sort',
      'words',
      'typo',
      'proximity',
      'attribute',
      'exactness',
    ],
  });
  logger.info('Updated settings');

  let until = Math.floor(Date.now() / 1000),
    rowCount = 0,
    totalCount = 0;
  do {
    const result = await pg.query<{
      id: string;
      pubkey: string;
      created_at: string;
      kind: number;
      tags: string[][];
      generic_tags: string[];
      content: string;
      sig: string;
      expired_at?: string;
      delegator?: string;
    }>(
      `SELECT * FROM events WHERE kind IN (0, 1, 30023) AND created_at <= ${until} ORDER BY created_at DESC LIMIT 1000`,
    );
    rowCount = result.rowCount;
    logger.info(`Fetched ${rowCount} events`);

    await eventIndex.addDocuments(
      result.rows.map((row) => ({
        id: row.id,
        pubkey: row.pubkey,
        createdAt: parseInt(row.created_at),
        kind: row.kind,
        tags: row.tags,
        genericTags: row.generic_tags,
        content: row.content,
        sig: row.sig,
        expiredAt: row.expired_at ? parseInt(row.expired_at) : undefined,
        delegator: row.delegator,
      })),
    );
    until = parseInt(result.rows[result.rows.length - 1].created_at);

    totalCount += rowCount;
    logger.info(`Added ${rowCount} events, total ${totalCount}`);
  } while (rowCount >= 1000);
  logger.info('Done');
}
run();
