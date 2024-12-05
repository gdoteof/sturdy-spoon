import { ripemd160, sha256 } from "@cosmjs/crypto";
import { bech32 } from 'bech32';
import * as tinySecp from 'tiny-secp256k1';
import Bip32Factory from 'bip32';
import { Account } from "@keystonehq/keystone-sdk";
import base58check from 'bs58check';

const bip32 = Bip32Factory(tinySecp);

export const getThorchainAddressFromKeyObj = (keyObj: Account, accountIndex: number, addressIndex: number = 0): string => {
    const node = bip32.fromBase58(keyObj.extendedPublicKey ?? "");
    const derived = node.derivePath(`${accountIndex}/${addressIndex}`);

    if (!derived.publicKey) return "";

    const publicKeyBytes = derived.publicKey;
    const publicKeySerialized = Buffer.from(publicKeyBytes).toString('hex');
    return generateThorchainAddress(publicKeySerialized);
};



export const generateThorchainAddress = (publicKeySerialized: string): string => {
    const hash160 = ripemd160(sha256(Buffer.from(publicKeySerialized, 'hex')));
    const words = bech32.toWords(hash160);
    return bech32.encode('thor', words);
};



export const getSegwitNativeBTC = (keyObj: Account, addressIndex: number): string => {
    const node = bip32.fromBase58(keyObj.extendedPublicKey ?? "");
    const derived = node.derivePath(`0/${addressIndex}`);
    
    if (!derived.publicKey) return "";
    
    const hash160 = ripemd160(sha256(derived.publicKey));
    
    const words = bech32.toWords(hash160);
    
    const versionWords = [0x00, ...words];
    
    return bech32.encode('bc', versionWords);
}

export const getSegwitCompatibleBTC = (keyObj: Account, addressIndex: number): string => {
 
    const node = bip32.fromBase58(keyObj.extendedPublicKey ?? "");
    
    const derived = node.derivePath(`0/${addressIndex}`);
    
    if (!derived.publicKey) {
        console.error('ERROR: No public key derived');
        return "";
    }
    
    const pubKeyHash = ripemd160(sha256(derived.publicKey));
    
    const redeemScript = Buffer.concat([Buffer.from([0x00, 0x14]), pubKeyHash]);
    
    const scriptHash = ripemd160(sha256(redeemScript));
    
    const versionedHash = Buffer.concat([Buffer.from([0x05]), scriptHash]);
    
    const address = base58check.encode(versionedHash);
    
    return address;
}

export const getBtcAddressFromKeyObj = (keyObj: Account, addressIndex: number): string => {

    if (!keyObj.path) {
        throw new Error("Path not provided in account");
    }
    
    let address: string;
    if (keyObj.path.startsWith("m/84'")) {
        address = getSegwitNativeBTC(keyObj, addressIndex);
    } else if (keyObj.path.startsWith("m/44'")) {
        address = getLegacyBTC(keyObj, addressIndex);
    } else if (keyObj.path.startsWith("m/49'")) {
        address = getSegwitCompatibleBTC(keyObj, addressIndex);
    } else {
        throw new Error(`Unsupported path: ${keyObj.path}`);
    }
    
    return address;
}
export const getLegacyBTC = (keyObj: Account, accountIndex: number, addressIndex: number = 0): string => {
    const node = bip32.fromBase58(keyObj.extendedPublicKey ?? "");
    const derived = node.derivePath(`${accountIndex}/${addressIndex}`);

    if (!derived.publicKey) {
        throw new Error("Could not derive public key");
    }

    const sha256Hash = sha256(derived.publicKey);
    const ripemd160Hash = ripemd160(sha256Hash);
    const versionedHash = Buffer.concat([Buffer.from([0x00]), ripemd160Hash]);
    return base58check.encode(versionedHash);
}