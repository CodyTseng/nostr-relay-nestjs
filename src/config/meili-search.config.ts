import { Environment } from './environment';

export function meiliSearchConfig(env: Environment) {
  return {
    host: env.MEILI_SEARCH_HOST,
    apiKey: env.MEILI_SEARCH_API_KEY,
    syncEventKinds: env.MEILI_SEARCH_SYNC_EVENT_KINDS ?? [0, 1, 30023],
  };
}
export type MeiliSearchConfig = ReturnType<typeof meiliSearchConfig>;
