import { getBtcAddressFromKeyObj, getThorchainAddressFromKeyObj } from "@/app/swap/utils/chainHelpers";
import { getBtcBalance, getThorBalance, thorApi } from "@/lib/thor_slice";
import KeystoneSDK, { UR } from "@keystonehq/keystone-sdk";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { Account, MultiAccounts } from "@keystonehq/keystone-sdk";
import { btcAPI, CheckBalanceParams } from "@/lib/btc_slice";
import { d } from "@cetusprotocol/cetus-sui-clmm-sdk";

export interface AddressInfo {
    address: string;
    index: number;
    balance: number;
    derivedAddresses: AddressWithBalance[];
}

export interface ScanResult {
    type: string;
    cbor: string;
}

export interface AddressWithBalance {
    address: string;
    balance: number;
    index: number;
}
export type KeystoneAccount = Account & AddressInfo;

export type KeystoneMultiAccount = Omit<MultiAccounts, "keys"> & {
    keys: KeystoneAccount[];
};
export const keystoneApi = createApi({
    reducerPath: 'walletApi',
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        processKeystoneScan: builder.mutation<KeystoneMultiAccount, ScanResult>({
            queryFn: async ({ type, cbor }) => {
                try {
                    const sdk = new KeystoneSDK();
                    const ur = new UR(Buffer.from(cbor, 'hex'), type);
                    const accounts = sdk.parseMultiAccounts(ur);
                    const keystoneAccounts = accounts.keys.map((account, accountIndex) => {
                        const derivedAddresses: AddressWithBalance[] = [];
                        for (let i = 0; i < 10; i++) {
                            let address = '';
                            switch (account.chain) {
                                case 'bitcoin':
                                    address = getBtcAddressFromKeyObj(account, i);
                                    break;
                                case 'thorchain':
                                    address = getThorchainAddressFromKeyObj(account, i);
                                    break;
                                default:
                                    throw new Error(`Unsupported chain ${account.chain}`);
                            }
                            derivedAddresses.push({ address, index: i, balance: 0 });
                        }
                        let balance = 0;
                        return { ...account, derivedAddresses, balance, index: accountIndex } as KeystoneAccount;
                    });
                    const keystoneMultiAccounts = { ...accounts, keys: keystoneAccounts };

                    return { data: keystoneMultiAccounts as KeystoneMultiAccount };
                } catch (error) {
                    return { error: { status: 'CUSTOM_ERROR', error: 'Failed to process Keystone scan', data: { message: 'Failed to process Keystone scan' } } };
                }
            },

        })
    })
}).enhanceEndpoints({
    // Check balances for all derived addresses
    endpoints: {
        processKeystoneScan: {
            onCacheEntryAdded: async (scanResult: ScanResult, api) => {
                const { data } = await api.cacheDataLoaded;
                const accounts = data?.keys;
                for (const account of accounts) {
                    const chain = account.chain;
                    switch (chain) {
                        case 'bitcoin':
                            account.derivedAddresses.forEach(async (address) => {
                                const checkBalanceParams: CheckBalanceParams = {
                                    fingerprint: data.masterFingerprint,
                                    derivationPath: account.path,
                                    accountIndex: account.index,
                                    addressIndex: address.index,
                                    address: address.address
                                };
                                api.dispatch(btcAPI.endpoints.checkBalance.initiate(checkBalanceParams));
                            });
                            break;
                        case 'thorchain':
                            account.derivedAddresses.forEach(async (address) => {
                                const checkBalanceParams: CheckBalanceParams = {
                                    fingerprint: data.masterFingerprint,
                                    derivationPath: account.path,
                                    accountIndex: account.index,
                                    addressIndex: address.index,
                                    address: address.address
                                };
                                api.dispatch(thorApi.endpoints.checkBalance.initiate(checkBalanceParams));
                            });
                            break;
                    }
                }
            }
        }
    }
});
