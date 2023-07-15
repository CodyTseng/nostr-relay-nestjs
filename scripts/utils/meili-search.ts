import { MeiliSearch } from 'meilisearch';

export function getMeiliSearchClient() {
  if (!process.env.MEILI_SEARCH_HOST || !process.env.MEILI_SEARCH_API_KEY) {
    throw new Error('Missing MEILI_SEARCH_HOST or MEILI_SEARCH_API_KEY');
  }
  return new MeiliSearch({
    host: process.env.MEILI_SEARCH_HOST,
    apiKey: process.env.MEILI_SEARCH_API_KEY,
  });
}
