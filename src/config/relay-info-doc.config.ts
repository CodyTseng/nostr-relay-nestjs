import * as packageJson from '../../package.json';
import { Environment } from './environment';

export function relayInfoDocConfig(env: Environment) {
  return {
    name: env.RELAY_NAME ?? packageJson.name,
    description: env.RELAY_DESCRIPTION ?? packageJson.description,
    pubkey: env.RELAY_PUBKEY,
    contact: env.RELAY_CONTACT,
    supported_nips: packageJson.supportedNips,
    software: packageJson.repository.url,
    version: packageJson.version,
  };
}
