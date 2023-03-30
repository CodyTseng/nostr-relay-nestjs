import { Environment } from './environment';

export function limitConfig(env: Environment) {
  return {
    createdAt: {
      upper: env.EVENT_CREATED_AT_UPPER_LIMIT,
    },
  };
}
export type LimitConfig = ReturnType<typeof limitConfig>;
