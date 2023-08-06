import { bytesToHex, Hex, PrivKey } from '@noble/curves/abstract/utils';
import { schnorr, secp256k1 } from '@noble/curves/secp256k1';
import { sha256 as nobleSha256 } from '@noble/hashes/sha256';

export function sha256(message: string | object): string {
  return bytesToHex(
    nobleSha256(
      Buffer.from(
        typeof message === 'string' ? message : JSON.stringify(message),
      ),
    ),
  );
}

export function schnorrVerify(
  signature: Hex,
  message: Hex,
  publicKey: Hex,
): boolean {
  try {
    return schnorr.verify(signature, message, publicKey);
  } catch {
    return false;
  }
}

export function schnorrSign(message: Hex, privateKey: PrivKey): string {
  return bytesToHex(schnorr.sign(message, privateKey));
}

export function getSharedSecret(privateA: PrivKey, publicB: Hex): Hex {
  return secp256k1.getSharedSecret(privateA, publicB);
}
