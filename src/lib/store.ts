import { cetusApi, cetusSlice } from '@/lib/cetus_slice'
import { thorApi, thorSlice } from '@/lib/thor_slice'
import { uiSlice } from '@/lib/ui_slice'
import { keystoneApi, walletSlice } from '@/lib/wallet_slice'
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

const storage =
  typeof window !== 'undefined'
    ? createWebStorage('local')
    : createNoopStorage();
    const persistConfig = {
      key: 'root',
      storage,
      whitelist: [
        cetusSlice.name,
        thorSlice.name,
        uiSlice.name,
        walletSlice.name,
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
    });
    const persistedReducer = persistReducer(persistConfig, rootReducer);
export const makeStore = () => {
  const store  = configureStore({
    devTools: process.env.NODE_ENV !== 'production',
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }).concat(cetusApi.middleware, thorApi.middleware, keystoneApi.middleware),
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
