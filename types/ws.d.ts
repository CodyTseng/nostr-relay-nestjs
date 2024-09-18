import 'ws';

declare module 'ws' {
  interface WebSocket {
    id: string;
    ip: string;
    pubkey?: string;
  }
}
