import { indexedDBAdapter } from '@/lib/indexdbAdapter';
import { initCetusSDK, Pool } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { openDB } from 'idb';



export interface Coin {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
}

export enum CetusSliceStatus {
    IDLE = "idle",
    LOADING = "loading",
    SUCCEEDED = "succeeded",
    FAILED = "failed",
}

interface CetusState {
    pools: Pool[];
    byCoin: Record<string, Pool[]>;
    status: CetusSliceStatus;
    filters: {
        nameFilter: string;
        coinTypeAFilter: string[];
        coinTypeBFilter: string[];
        feeRateFilter: [number, number];
        isPauseFilter: boolean | null;
        liquidityFilter: [number, number];
    };
}

const initialState: CetusState = {
    pools: [],
    byCoin: {},
    status: CetusSliceStatus.IDLE,
    filters: {
        nameFilter: "",
        coinTypeAFilter: [],
        coinTypeBFilter: [],
        feeRateFilter: [0, 0],
        isPauseFilter: null,
        liquidityFilter: [0, 0],
    }
};


const messages: Record<CetusSliceStatus, string> = {
    [CetusSliceStatus.IDLE]: "CURRENTLY IDLE",
    [CetusSliceStatus.LOADING]: "Loading pools... this will take a minute",
    [CetusSliceStatus.SUCCEEDED]: "Pools loaded",
    [CetusSliceStatus.FAILED]: "Failed to load pools",
} as const;

export const cetusSlice = createSlice({
    name: "cetus",
    initialState: ()=>{
        return initialState;
    },
    reducers: {
        setPools(state, action) {
            state.pools = action.payload;
            state.byCoin = action.payload.reduce((acc: Record<string, Pool[]>, pool: Pool) => {
                acc[pool.coinTypeA] = acc[pool.coinTypeA] || [];
                acc[pool.coinTypeA].push(pool);
                acc[pool.coinTypeB] = acc[pool.coinTypeB] || [];
                acc[pool.coinTypeB].push(pool);
                return acc;
            }, {} as Record<string, Pool[]>);

        },
        setCetusStatus(state, action) {
            state.status = action.payload;
        },
        setFilters(state, action) {
            state.filters = action.payload;
        },
        setFeeRateFilter(state, action) {
            state.filters.feeRateFilter = action.payload;
        },
        setCoinTypeAFilter(state, action) {
            state.filters.coinTypeAFilter = action.payload;
        },
        setCoinTypeBFilter(state, action) {
            state.filters.coinTypeBFilter = action.payload;
        },
        setNameFilter(state, action) {
            state.filters.nameFilter = action.payload;
        },
        setIsPauseFilter(state, action) {
            state.filters.isPauseFilter = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(loadPoolsFromIndexedDB.fulfilled, (state, action) => {
            console.log("fulfilled: loadPoolsFromIndexedDB", action.payload);
            state.pools = action.payload;
            state.byCoin = action.payload.reduce((acc, pool) => {
              acc[pool.coinTypeA] = acc[pool.coinTypeA] || [];
              acc[pool.coinTypeA].push(pool);
              acc[pool.coinTypeB] = acc[pool.coinTypeB] || [];
              acc[pool.coinTypeB].push(pool);
              return acc;
            }, {} as Record<string, Pool[]>);
            state.status = CetusSliceStatus.SUCCEEDED;
          })
            .addMatcher(
                cetusApi.endpoints.getPools.matchPending,
                (state) => {
                    state.status = CetusSliceStatus.LOADING;
                }
            )
            .addMatcher(
                cetusApi.endpoints.getPools.matchFulfilled,
                (state, { payload }) => {
                    console.log("matchFulfilled", payload);
                    state.pools = payload.filter((pool: Pool) => pool.coinTypeA && pool.coinTypeB && pool.liquidity && pool.fee_rate < 999999);
                    state.status = CetusSliceStatus.SUCCEEDED;

                    state.byCoin = payload.reduce((acc: Record<string, Pool[]>, pool: Pool) => {
                        acc[pool.coinTypeA] = acc[pool.coinTypeA] || [];
                        acc[pool.coinTypeA].push(pool);
                        acc[pool.coinTypeB] = acc[pool.coinTypeB] || [];
                        acc[pool.coinTypeB].push(pool);
                        return acc;
                    }, {} as Record<string, Pool[]>);
                }
            )
            .addMatcher(
                cetusApi.endpoints.getPools.matchRejected,
                (state) => {
                    state.status = CetusSliceStatus.FAILED;
                }
            );
    },
    selectors: {
        getPoolsByCoin: (state: CetusState, coin: Coin) => {
            return state.byCoin[coin.symbol] || [];
        },
        listCoins: (state: CetusState) => {
            const keys = Object.keys(state.byCoin);
            return keys;
        },
        getStatusMessage: (state: CetusState) => {
            const msg = state.status ? messages[state.status] : messages[CetusSliceStatus.IDLE];
            return msg;
        },
        getAllPools: (state: CetusState) => {
            return state.pools;
        },
        getFilters: (state: CetusState) => {
            return state.filters;
        },
    }
});


const cetusClmmSDK = initCetusSDK({ network: 'mainnet' });

export const loadPoolsFromIndexedDB = createAsyncThunk(
    'cetus/loadPoolsFromIndexedDB',
    async (_, thunkAPI) => {
      const db = await openDB('cetus', 1, {
        upgrade(db) {
          db.createObjectStore('pools');
        },
      });
      const pools = await dbAdapter(db).loadPools();
      return pools;
    }
  );
  
export const cetusApi = createApi({
    reducerPath: "cetusApi",
    baseQuery: fakeBaseQuery(),
    endpoints: (builder) => ({
        getPools: builder.query<Pool[], void>({
            async onCacheEntryAdded(arg, api) {
            },
            queryFn: async () => {
                return new Promise((resolve, reject) => {
                    cetusClmmSDK.Pool.getPoolsWithPage([]).then((data) => {
                        console.log("getPools", data);
                        const pools = data as Pool[];
                        resolve({ data: pools });
                    }).catch((error) => {
                        reject(error);
                    });
                }
                );
            },
        }),
    }),
    refetchOnReconnect: false,
});
const dbAdapter = indexedDBAdapter;

openDB('cetus', 1, {
    upgrade(db: { createObjectStore: (arg0: string) => void; }) {
        db.createObjectStore('pools');
    },
}).then(async (db) => {
    // This is a workaround to get the db into the onQueryStarted function
    cetusApi.enhanceEndpoints({
        endpoints: {
            getPools: {
                onQueryStarted: async (args, api) => {
                    try {
                        const data = await (await dbAdapter(db).loadPools()).filter(
                            (pool: Pool) => pool.coinTypeA && pool.coinTypeB && pool.liquidity && pool.fee_rate < 999999
                        )
                        if (data) {
                            api.dispatch(cetusSlice.actions.setPools(data));
                        }
                        // cancel the query from going to the network
                        return;
                    } catch (error) {
                        console.error("onQueryStarted", error);
                        api.dispatch(cetusSlice.actions.setCetusStatus(CetusSliceStatus.FAILED));
                        return;
                    }
                },

                onCacheEntryAdded: async (_, { cacheDataLoaded }) => {
                    const { data } = await cacheDataLoaded;
                    try {
                        await dbAdapter(db).savePools(data);
                    } catch (error) {
                        console.error("onCacheEntryAdded", error);
                    }
                },
            },
        },
    });


})