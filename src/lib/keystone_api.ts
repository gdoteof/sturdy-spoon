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
                        console.log(`Processing account ${account.name} for chain ${account.chain} index ${accountIndex}`);
                        const derivedAddresses: AddressWithBalance[] = [];
                        for (let i = 0; i < 10; i++) {
                            let address = '';
                            console.log(`Processing address ${i}`);
                            switch (account.chain) {
                                case 'BTC':
                                    address = getBtcAddressFromKeyObj(account, i);
                                    break;
                                case 'RUNE':
                                    address = getThorchainAddressFromKeyObj(account, i);
                                    break;
                                default:
                                    continue;
                            }
                            derivedAddresses.push({ address, index: i, balance: 0 });
                        }
                        let balance = 0;
                        return { ...account, derivedAddresses, balance, index: accountIndex } as KeystoneAccount;
                    });
                    const keystoneMultiAccounts = { ...accounts, keys: keystoneAccounts };

                    return { data: keystoneMultiAccounts as KeystoneMultiAccount };
                } catch (error) {
                    console.error(`Failed to process Keystone scan: ${error}`);
                    return { error: { status: 'CUSTOM_ERROR', error: 'Failed to process Keystone scan', data: { message: 'Failed to process Keystone scan' } } };
                }
            },

        })
    })
})
