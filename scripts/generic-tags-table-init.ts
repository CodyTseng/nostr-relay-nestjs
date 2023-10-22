import 'dotenv/config';
import Pino from 'pino';
import { getPgClient } from './utils';

async function run() {
  const logger = Pino();

  const pg = await getPgClient();

  const limit = 1000;
  const now = Math.floor(Date.now() / 1000);
  let until = now,
    rowCount = 0,
    totalCount = 0,
    lastEventId: string | undefined;
  do {
    logger.info(
      `SELECT * FROM events WHERE cardinality(generic_tags) > 0 AND created_at <= ${until} AND (expired_at IS NULL OR expired_at > ${now}) ORDER BY created_at DESC LIMIT ${limit}`,
    );
    const result = await pg.query<{
      id: string;
      pubkey: string;
      author: string;
      created_at: string;
      kind: number;
      tags: string[][];
      generic_tags: string[];
      content: string;
      sig: string;
      expired_at: string | null;
      d_tag_value: string | null;
    }>(
      `SELECT * FROM events WHERE cardinality(generic_tags) > 0 AND created_at <= $1 AND (expired_at IS NULL OR expired_at > $2) ORDER BY created_at DESC LIMIT $3`,
      [until, now, limit],
    );
    rowCount = result.rowCount;
    logger.info(`Fetched ${rowCount} events`);

    const startIndex = lastEventId
      ? result.rows.findIndex((row) => row.id === lastEventId) + 1
      : 0;

    const events = result.rows.slice(startIndex).map((row) => ({
      id: row.id,
      genericTags: row.generic_tags,
      author: row.author,
      createdAt: parseInt(row.created_at),
      kind: row.kind,
    }));

    await Promise.all(
      events
        .map((event) =>
          event.genericTags.map((tag) => {
            pg.query(
              `INSERT INTO generic_tags (tag, author, created_at, kind, event_id) VALUES ($1, $2, $3, $4, $5)`,
              [tag, event.author, event.createdAt, event.kind, event.id],
            ).catch((error) => {
              if (error.code === '23505') {
                // 23505 is unique_violation
                return;
              }
              throw error;
            });
          }),
        )
        .flat(),
    );
    until = parseInt(result.rows[result.rows.length - 1].created_at);
    lastEventId = result.rows[result.rows.length - 1].id;

    totalCount += events.length;
    logger.info(`Added ${events.length} events, total ${totalCount}`);
  } while (rowCount >= limit);
  logger.info('Done');
}
run();
