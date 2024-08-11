import 'express';

declare module 'express' {
  export interface Request {
    pubkey?: string;
  }
}
