import { Environment } from './environment';

export function limitConfig(env: Environment) {
  return {
    createdAtLowerLimit: env.CREATED_AT_LOWER_LIMIT,
    createdAtUpperLimit: env.CREATED_AT_UPPER_LIMIT,
    minPowDifficulty: env.MIN_POW_DIFFICULTY ?? 0,
    maxSubscriptionsPerClient: env.MAX_SUBSCRIPTIONS_PER_CLIENT ?? 20,
    blacklist: env.BLACKLIST,
    whitelist: env.WHITELIST,
  };
}
export type LimitConfig = ReturnType<typeof limitConfig>;
