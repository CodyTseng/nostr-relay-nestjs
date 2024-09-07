import { Environment } from './environment';

export function wotConfig(env: Environment) {
  return {
    trustAnchorPubkey: env.WOT_TRUST_ANCHOR_PUBKEY,
    trustDepth: env.WOT_TRUST_DEPTH ?? 0,
    refreshInterval: env.WOT_REFRESH_INTERVAL,
    fetchFollowListFrom: env.WOT_FETCH_FOLLOW_LIST_FROM,
    skipFilters: env.WOT_SKIP_FILTERS,
  };
}
