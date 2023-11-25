import * as packageJson from '../../package.json';
import { Environment } from './environment';

export function relayInfoDocConfig(env: Environment) {
  return {
    name: env.RELAY_NAME ?? packageJson.name,
    description: env.RELAY_DESCRIPTION ?? packageJson.description,
    pubkey: env.RELAY_PUBKEY,
    contact: env.RELAY_CONTACT,
    software: packageJson.repository.url,
    version: packageJson.version,
    git_commit_sha: env.GIT_COMMIT_SHA,
    limitation: {
      max_message_length: 128 * 1024, // 128 KB
      max_subscriptions: env.MAX_SUBSCRIPTIONS_PER_CLIENT ?? 20,
      max_filters: 10,
      max_limit: 1000,
      max_subid_length: 128,
      max_event_tags: 2000,
      max_content_length: 102400,
      min_pow_difficulty: env.EVENT_ID_MIN_LEADING_ZERO_BITS ?? 0,
      auth_required: false,
      payment_required: false,
      restricted_writes: false,
      created_at_lower_limit: env.EVENT_CREATED_AT_LOWER_LIMIT,
      created_at_upper_limit: env.EVENT_CREATED_AT_UPPER_LIMIT,
    },
    retention: [{ time: null }],
  };
}
export type RelayInfoDoc = ReturnType<typeof relayInfoDocConfig>;
