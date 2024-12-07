import { Asset, AssetType, CryptoAmount } from '@xchainjs/xchain-util'
import { MidgardApi, PoolDetail } from '@xchainjs/xchain-midgard';

import {
    QuoteSwapParams,
    ThorchainQuery,
    TxDetails,
    SwapEstimate,
    LiquidityPosition,
    AddliquidityPosition,
    EstimateAddLP,
} from '@xchainjs/xchain-thorchain-query'
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'

import cosmosclient from '@cosmos-client/core'
import axios from 'axios'
import { register9Rheader, assetFromStringEx } from '@xchainjs/xchain-util'
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Client } from "@xchainjs/xchain-thorchain";
import { walletSlice } from '@/lib/wallet_slice';
import { CheckBalanceParams, CheckBalanceResponse } from '@/lib/btc_slice';

register9Rheader(axios)
register9Rheader(cosmosclient.config.globalAxios)

const thorchainQuery = new ThorchainQuery()

const midgardApi = new MidgardApi();
export interface CheckPositionParams {
    address: string;
    asset: Asset;
}
const thorClient = new Client({});

export const getThorBalance = async (address: string): Promise<number> => {
    try {
        const balance = await thorClient.getBalance(address);
        return balance.length > 0 ? balance[0].amount.amount().toNumber() : 0;
    } catch (error) {
        return 0;
    }
};
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


export const thorApi = createApi({
    reducerPath: 'thorApi',
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        checkBalance: builder.query<CheckBalanceResponse, CheckBalanceParams>({
            queryFn: async (checkBalanceParams) => {
                const { fingerprint, derivationPath, accountIndex, addressIndex, address } = checkBalanceParams
                const balance = await getThorBalance(address)
                return {
                    data: {
                        balance,
                        checkBalanceParams
                    }
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
        estimateAddLiquidity: builder.query<EstimateAddLP, AddliquidityPosition>({
            queryFn: async (params) => {
                try {
                    const estimate = await thorchainQuery.estimateAddLP(params)
                    return {
                        data: estimate
                    }
                } catch (error) {
                    return { error: { status: 'CUSTOM_ERROR', error: 'Failed to estimate add liquidity', data: { message: 'Failed to estimate add liquidity' } } }
                }
            },
        }),
        listPools: builder.query<PoolDetail[], void>({
            queryFn: async () => {
                const pools = await midgardApi.getPools()
                const { data } = pools
                try {
                    return {
                        data
                    }
                } catch (error) {
                    return { error: { status: 'CUSTOM_ERROR', error: 'Failed to fetch pools', data: { message: 'Failed to fetch pools' } } }
                }
            },
        }),
        quoteSwap: builder.mutation<TxDetails, QuoteSwapParams>({
            queryFn: async (params) => {
                try {
                    const estimate = await thorchainQuery.quoteSwap(params)
                    return {
                        data: estimate
                    }
                } catch (error) {
                    return { error: { status: 'CUSTOM_ERROR', error: 'Failed to quote swap', data: { message: 'Failed to quote swap' } } }
                }
            },
        }),
    }),
}).enhanceEndpoints({
    endpoints: {
        checkBalance: {
            onCacheEntryAdded: async (_checkBalanceParams, api) => {
                const { data } = await api.cacheDataLoaded;
                api.dispatch(walletSlice.actions.setBalanceForAddress(data));
            }
        },

    }
});

type ThorAddress = string

export type ThorAsset = QuoteSwapParams["fromAsset"];
export interface ThorSliceState {
    pools: PoolDetail[];
    watchList: ThorAddress[];
    relevantAssets: ThorAsset["ticker"][];
    liquidityPositions: LiquidityPosition[];
}


const initialState: ThorSliceState = {
    pools: [],
    watchList: [],
    relevantAssets: [],
    liquidityPositions: [],
}

export const thorSlice = createSlice({
    name: 'thor',
    initialState,
    reducers: {
        setPools: (state, action: PayloadAction<PoolDetail[]>) => {
            state.pools = action.payload
        },
        addToWatchList: (state, action: PayloadAction<ThorAddress>) => {
            state.watchList.push(action.payload)
        }
    },
    selectors: {
        selectPools: (state: ThorSliceState) => state.pools,
        selectLiquidityPositions: (state: ThorSliceState) => state.liquidityPositions,
        selectWatchList: (state: ThorSliceState) => state.watchList,
    },
    extraReducers: (builder) => {
        builder.addMatcher(thorApi.endpoints.listPools.matchFulfilled, (state, action) => {
            state.pools = action.payload;
            state.pools.forEach((pool) => {
                state.relevantAssets.push(pool.asset)
                state.watchList.forEach((address) => {
                    const asset: Asset = {
                        chain: 'THOR',
                        symbol: pool.asset,
                        ticker: pool.asset,
                        type: AssetType.NATIVE
                    }
                });
            });
        });
        builder.addMatcher(thorApi.endpoints.checkPosition.matchFulfilled, (state, action) => {
            const position = action.payload
            if (position) {
                state.liquidityPositions.push(position)
            }
        });
    },
})