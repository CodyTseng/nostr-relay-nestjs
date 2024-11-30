import * as secp256k1 from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

export const verifySignature = secp256k1.verify;
export { sha256, bytesToHex };
