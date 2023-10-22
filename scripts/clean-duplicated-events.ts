import 'dotenv/config';
import Pino from 'pino';
import { getPgClient } from './utils';

async function run() {
  const logger = Pino();

  const pg = await getPgClient();

  // parameterized replaceable events
  const duplicatedParameterizedReplaceableEvents = await pg.query<{
    author: string;
    kind: number;
    d_tag_value: string;
  }>(
    `SELECT author, kind, d_tag_value FROM events WHERE kind BETWEEN 30000 AND 39999 GROUP BY author, kind, d_tag_value HAVING COUNT(*) > 1`,
  );

  logger.info(
    `Found ${duplicatedParameterizedReplaceableEvents.rowCount} duplicated parameterized replaceable events`,
  );
  for (const row of duplicatedParameterizedReplaceableEvents.rows) {
    const latestEvent = await pg.query<{ id: string; created_at: string }>(
      `SELECT id, created_at FROM events WHERE author = $1 AND kind = $2 AND d_tag_value = $3 ORDER BY created_at DESC LIMIT 1`,
      [row.author, row.kind, row.d_tag_value],
    );
    const latestEventId = latestEvent.rows[0]?.id;
    if (!latestEventId) continue;

    logger.info(
      `Deleting duplicated parameterized replaceable events (author: ${row.author}, kind: ${row.kind}, d_tag_value: ${row.d_tag_value})`,
    );
    await pg.query(
      `DELETE FROM events WHERE author = $1 AND kind = $2 AND d_tag_value = $3 AND id != $4`,
      [row.author, row.kind, row.d_tag_value, latestEventId],
    );
  }

  // replaceable events
  const replaceableEvents = await pg.query<{
    author: string;
    kind: number;
  }>(
    `SELECT author, kind FROM events WHERE kind BETWEEN 10000 AND 19999 GROUP BY author, kind HAVING COUNT(*) > 1`,
  );

  logger.info(
    `Found ${replaceableEvents.rowCount} duplicated replaceable events`,
  );
  for (const row of replaceableEvents.rows) {
    const latestEvent = await pg.query<{ id: string; created_at: string }>(
      `SELECT id, created_at FROM events WHERE author = $1 AND kind = $2 ORDER BY created_at DESC LIMIT 1`,
      [row.author, row.kind],
    );
    const latestEventId = latestEvent.rows[0]?.id;
    if (!latestEventId) continue;

    logger.info(
      `Deleting duplicated replaceable events (author: ${row.author}, kind: ${row.kind})`,
    );
    await pg.query(
      `DELETE FROM events WHERE author = $1 AND kind = $2 AND id != $3`,
      [row.author, row.kind, latestEventId],
    );
  }
}
run();
