import * as packageJson from '../../package.json';
import { Environment } from './environment';

export function relayInfoConfig(env: Environment) {
  return {
    name: env.RELAY_NAME ?? packageJson.name,
    description: env.RELAY_DESCRIPTION ?? packageJson.description,
    pubkey: env.RELAY_PUBKEY,
    contact: env.RELAY_CONTACT,
    software: packageJson.repository.url,
    version: packageJson.version,
    gitCommitSha: env.GIT_COMMIT_SHA,
    propagateTo: env.RELAY_PROPAGATE_TO ?? [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://nostr.wine'
    ],
  };
}
