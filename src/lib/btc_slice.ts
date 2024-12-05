import { Asset, AssetType, CryptoAmount } from '@xchainjs/xchain-util'
import { MidgardApi, PoolDetail } from '@xchainjs/xchain-midgard';

import {
    QuoteSwapParams,
    ThorchainQuery,
    TxDetails,
    SwapEstimate,
    LiquidityPosition,
} from '@xchainjs/xchain-thorchain-query'
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

import cosmosclient from '@cosmos-client/core'
import axios from 'axios'
import { register9Rheader, assetFromStringEx } from '@xchainjs/xchain-util'
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Client } from "@xchainjs/xchain-thorchain";
import { walletSlice } from '@/lib/wallet_slice';

register9Rheader(axios)
register9Rheader(cosmosclient.config.globalAxios)

const thorchainQuery = new ThorchainQuery()

const midgardApi = new MidgardApi();
export interface CheckPositionParams {
    address: string;
    asset: Asset;
}

export const getBtcBalance = async (address: string): Promise<number> => {
    try {
        // Blockchain.info API for checking address balance
        const url = `https://blockchain.info/balance?active=${address}`;
        const response = await axios.get(url);

        // Extract balance in satoshis
        const balanceInSatoshis = response.data[address]?.final_balance;
        console.log(`Address: ${address}, Balance: ${balanceInSatoshis}`);

        if (balanceInSatoshis === undefined) {
            throw new Error("Invalid address or no data available.");
        }

        // Convert satoshis to BTC
        const balanceInBTC = balanceInSatoshis / 1e8;

        return balanceInBTC;
    } catch (e) {
        const error = e as Error;
        return 0;
    }
}


export const btcAPI = createApi({
    reducerPath: 'btcAPI',
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        checkBalance: builder.query<number, string>({
            queryFn: async (address) => {
                console.log(`Inside queryFN, Checking balance for ${address}`);
                const balance = await getBtcBalance(address)
                return {
                    data: balance
                }
            },
        }),
        checkPosition: builder.query<LiquidityPosition | null, CheckPositionParams>({
            queryFn: async (action) => {
                const { address } = action
                const asset = assetFromStringEx(action.asset.ticker) as Asset;
                try {
                    const lp = await thorchainQuery.checkLiquidityPosition(asset, address)
                    return {
                        data: lp
                    }
                } catch (error) {
                    return { error: { status: 'CUSTOM_ERROR', error: 'Failed to fetch pools', data: { message: (error as Error).message } } }
                }
            },
        }),
    }),
}).enhanceEndpoints({
    endpoints: {
        checkBalance: {
            onCacheEntryAdded: async (account: string, api) => {
                console.log(`In cache entry added for ${account}`);
                const { data } = await api.cacheDataLoaded;
                const balance = data;
                console.log(`Balance for address ${account} is ${balance}`);
                api.dispatch(walletSlice.actions.setBalanceForAddress({ address: account, balance }));
            },
        },
    },
});

