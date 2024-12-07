import { btcAPI } from '@/lib/btc_slice';
import { cetusApi, cetusSlice } from '@/lib/cetus_slice'
import { keystoneApi } from '@/lib/keystone_api';
import { thorApi, thorSlice } from '@/lib/thor_slice'
import { uiSlice } from '@/lib/ui_slice'
import { walletSlice } from '@/lib/wallet_slice'
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, _value: any) {
      return Promise.resolve();
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

let storage
try {
  storage = createWebStorage('local')
} catch (error) {
  storage = createNoopStorage();
}
const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
    cetusSlice.name,
    thorSlice.name,
    uiSlice.name,
    walletSlice.name,
    btcAPI.reducerPath,
    thorApi.reducerPath,
  ],
  blacklist: [

  ],
};


const rootReducer = combineReducers({
  [cetusApi.reducerPath]: cetusApi.reducer,
  [cetusSlice.name]: cetusSlice.reducer,
  [thorSlice.name]: thorSlice.reducer,
  [thorApi.reducerPath]: thorApi.reducer,
  [uiSlice.name]: uiSlice.reducer,
  [keystoneApi.reducerPath]: keystoneApi.reducer,
  [walletSlice.name]: walletSlice.reducer,
  [btcAPI.reducerPath]: btcAPI.reducer,
});
const makeConfiguredStore = () => 
  configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }).concat(btcAPI.middleware, cetusApi.middleware, thorApi.middleware, keystoneApi.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  });
export const makeStore = () => {
  const isServer = typeof window === 'undefined';
  if (isServer) {
    return makeConfiguredStore();
  }
  const persistedReducer = persistReducer(persistConfig, rootReducer);
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }).concat(cetusApi.middleware, thorApi.middleware, keystoneApi.middleware, btcAPI.middleware),
    devTools: process.env.NODE_ENV !== 'production',
  })
  const persistor = persistStore(store);
  // @ts-ignore
  store.__persistor = persistor;
  return store;
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
