import 'ws';

declare module 'ws' {
  interface WebSocket {
    id: string;
    pubkey?: string;
  }
}
