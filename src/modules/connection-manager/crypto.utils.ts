// Using dynamic imports for ESM modules
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@noble/hashes/utils';

// We'll use a more direct approach to handle the ESM module
let secp256k1: any = null;
let importPromise: Promise<any> | null = null;

async function getSecp256k1() {
    if (secp256k1) return secp256k1;
    
    if (!importPromise) {
        importPromise = (async () => {
            try {
                const secp = await import('@noble/secp256k1');
                secp256k1 = secp.default || secp;
                return secp256k1;
            } catch (error) {
                console.error('Failed to load secp256k1:', error);
                throw error;
            }
        })();
    }
    
    return importPromise;
}

export async function verifySignature(signature: string, message: string, publicKey: string): Promise<boolean> {
    try {
        const secp = await getSecp256k1();
        return await secp.verify(signature, message, publicKey);
    } catch (error) {
        console.error('Verification error:', error);
        return false;
    }
}

export { sha256, bytesToHex };
