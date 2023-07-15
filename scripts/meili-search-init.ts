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

  const limit = 1000;
  let until = Math.floor(Date.now() / 1000),
    rowCount = 0,
    totalCount = 0,
    lastEventId: string | undefined;
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
      `SELECT * FROM events WHERE kind IN (0, 1, 30023) AND created_at <= ${until} ORDER BY created_at DESC LIMIT ${limit}`,
    );
    rowCount = result.rowCount;
    logger.info(`Fetched ${rowCount} events`);

    const startIndex = lastEventId
      ? result.rows.findIndex((row) => row.id === lastEventId) + 1
      : 0;

    const eventDocuments = result.rows.slice(startIndex).map((row) => ({
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
    }));

    await eventIndex.addDocuments(eventDocuments);
    until = parseInt(result.rows[result.rows.length - 1].created_at);
    lastEventId = result.rows[result.rows.length - 1].id;

    totalCount += eventDocuments.length;
    logger.info(`Added ${eventDocuments.length} events, total ${totalCount}`);
  } while (rowCount >= limit);
  logger.info('Done');
}
run();
