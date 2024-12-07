import { ripemd160, sha256 } from "@cosmjs/crypto";
import { bech32 } from 'bech32';
import * as tinySecp from 'tiny-secp256k1';
import Bip32Factory from 'bip32';
import { Account } from "@keystonehq/keystone-sdk";
import base58check from 'bs58check';
import { CoinAccount } from "@/lib/wallet_slice";

const bip32 = Bip32Factory(tinySecp);

export const getSendableAddress = (coinAccount: CoinAccount, addressIndex: number): string => {
    const { derivationPath, xpub, symbol, index: accountIndex } = coinAccount;
    switch (symbol) {
        case 'BTC':
            return generateBtcAddress(derivationPath, xpub, addressIndex, accountIndex);
        case 'RUNE':
            return getThorchainAddress(xpub, accountIndex, addressIndex);
        default:
            console.warn(`Unsupported symbol: ${symbol}`);
            return "";
    }
}

export const getThorchainAddressFromKeyObj = (keyObj: Account, accountIndex: number, addressIndex: number = 0): string => {
    const node = bip32.fromBase58(keyObj.extendedPublicKey ?? "");
    const derived = node.derivePath(`${accountIndex}/${addressIndex}`);

    if (!derived.publicKey) return "";

    const publicKeyBytes = derived.publicKey;
    const publicKeySerialized = Buffer.from(publicKeyBytes).toString('hex');
    return generateThorchainAddress(publicKeySerialized);
};

export const getThorchainAddress = (xpub: string, accountIndex: number, addressIndex: number): string => {
    const node = bip32.fromBase58(xpub);
    const derived = node.derivePath(`${accountIndex}/${addressIndex}`);

    if (!derived.publicKey) return "";

    const publicKeyBytes = derived.publicKey;
    const publicKeySerialized = Buffer.from(publicKeyBytes).toString('hex');
    return generateThorchainAddress(publicKeySerialized);
}



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

export const generateBtcAddress = (path: string, xpub: string, addressIndex: number, accountIndex: number, isChangeAddress: boolean = false): string => {
    const node = bip32.fromBase58(xpub);
    const derived = node.derivePath(`${accountIndex}/${isChangeAddress ? 1 : 0}/${addressIndex}`);
    if (!derived.publicKey) {
        throw new Error("Could not derive public key");
    }
    const sha256Hash = sha256(derived.publicKey);
    const ripemd160Hash = ripemd160(sha256Hash);
    if (path.startsWith("m/84'")) {
        const words = bech32.toWords(ripemd160Hash);
        return bech32.encode('bc', words);
    } else if (path.startsWith("m/44'")) {
        const versionedHash = Buffer.concat([Buffer.from([0x00]), ripemd160Hash]);
        return base58check.encode(versionedHash);
    } else if (path.startsWith("m/49'")) {
        const redeemScript = Buffer.concat([Buffer.from([0x00, 0x14]), ripemd160Hash]);
        const scriptHash = ripemd160(sha256(redeemScript));
        const versionedHash2 = Buffer.concat([Buffer.from([0x05]), scriptHash]);
        return base58check.encode(versionedHash2);
    }
    else {
        throw new Error(`Unsupported path: ${path}`);
    }
}

export const generateSegwitBtc = (xpub: string, addressIndex: number, accountIndex: number, isChangeAddress: boolean = false): string => {
    const node = bip32.fromBase58(xpub);
    const derived = node.derivePath(`${accountIndex}/${isChangeAddress ? 1 : 0}/${addressIndex}`);
    if (!derived.publicKey) {
        throw new Error("Could not derive public key");
    }
    const sha256Hash = sha256(derived.publicKey);
    const ripemd160Hash = ripemd160(sha256Hash);
    const versionedHash = Buffer.concat([Buffer.from([0x00]), ripemd160Hash]);
    return base58check.encode(versionedHash);
}