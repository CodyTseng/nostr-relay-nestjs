import { Environment } from './environment';

export function meiliSearchConfig(env: Environment) {
  return {
    host: env.MEILI_SEARCH_HOST,
    apiKey: env.MEILI_SEARCH_API_KEY,
  };
}
export type MeiliSearchConfig = ReturnType<typeof meiliSearchConfig>;
