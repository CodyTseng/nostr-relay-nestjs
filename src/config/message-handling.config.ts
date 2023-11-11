import { Environment } from './environment';

export function messageHandlingConfig(env: Environment) {
  return {
    event: env.EVENT_MESSAGE_HANDLING_ENABLED ?? true,
    req: env.REQ_MESSAGE_HANDLING_ENABLED ?? true,
    close: env.CLOSE_MESSAGE_HANDLING_ENABLED ?? true,
    top: env.TOP_MESSAGE_HANDLING_ENABLED ?? true,
    auth: env.AUTH_MESSAGE_HANDLING_ENABLED ?? true,
  };
}
export type MessageHandlingConfig = ReturnType<typeof messageHandlingConfig>;
