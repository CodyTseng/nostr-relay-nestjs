import { Environment } from './environment';

export function limitConfig(env: Environment) {
  return {
    createdAt: {
      upper: env.EVENT_CREATED_AT_UPPER_LIMIT,
      lower: env.EVENT_CREATED_AT_LOWER_LIMIT,
    },
    eventId: {
      minLeadingZeroBits: env.EVENT_ID_MIN_LEADING_ZERO_BITS ?? 0,
    },
    subscription: {
      maxSubscriptionsPerClient: env.MAX_SUBSCRIPTIONS_PER_CLIENT ?? 20,
    },
  };
}
export type LimitConfig = ReturnType<typeof limitConfig>;
