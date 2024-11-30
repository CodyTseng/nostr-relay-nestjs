// Using dynamic imports for ESM modules
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

let secp256k1: any;

async function initializeCrypto() {
    const secp = await import('@noble/secp256k1');
    secp256k1 = secp.default;
}

// Initialize the crypto module
initializeCrypto().catch(console.error);

export async function verifySignature(signature: string, message: string, publicKey: string): Promise<boolean> {
    if (!secp256k1) {
        await initializeCrypto();
    }
    return secp256k1.verify(signature, message, publicKey);
}

export { sha256, bytesToHex };
