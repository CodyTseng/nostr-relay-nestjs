// Using dynamic imports for ESM modules
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

let secp256k1: any = null;

async function loadSecp256k1() {
    if (!secp256k1) {
        try {
            const secp = await import('@noble/secp256k1');
            secp256k1 = secp.default;
        } catch (error) {
            console.error('Failed to load secp256k1:', error);
            throw error;
        }
    }
    return secp256k1;
}

export async function verifySignature(signature: string, message: string, publicKey: string): Promise<boolean> {
    try {
        const secp = await loadSecp256k1();
        return secp.verify(signature, message, publicKey);
    } catch (error) {
        console.error('Verification error:', error);
        return false;
    }
}

export { sha256, bytesToHex };
