import {
    indexedDB,
    IDBCursor,
    IDBCursorWithValue,
    IDBDatabase,
    IDBFactory,
    IDBIndex,
    IDBKeyRange,
    IDBObjectStore,
    IDBOpenDBRequest,
    IDBRequest,
    IDBTransaction,
    IDBVersionChangeEvent,
} from "fake-indexeddb";
if (global.indexedDB === undefined) {
  // @ts-ignore
  global.indexedDB = indexedDB;
  global.IDBIndex = IDBIndex;
    global.IDBCursor = IDBCursor;
    global.IDBRequest = IDBRequest;
    global.IDBTransaction = IDBTransaction;
    global.IDBKeyRange = IDBKeyRange;
    global.IDBObjectStore = IDBObjectStore;
    global.IDBDatabase = IDBDatabase;
    global.IDBFactory = IDBFactory;
    global.IDBOpenDBRequest = IDBOpenDBRequest;
    global.IDBVersionChangeEvent = IDBVersionChangeEvent;
    global.IDBCursorWithValue = IDBCursorWithValue;

}
import { Pool } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { IDBPDatabase, openDB } from 'idb';



export const indexedDBAdapter = (db : IDBPDatabase) => ({
    async savePool(key: string, data: Pool) {


        const transaction = db.transaction('pools', 'readwrite');
        const store = transaction.objectStore('pools');

        store.put(data, key);
    },

    async loadPools() {
        return new Promise<Pool[]>(async (resolve, reject) => {
            console.log("loading pools");

            const transaction = db.transaction('pools', 'readonly');
            console.log("transaction", transaction);
            const store = transaction.objectStore('pools');
            console.log("store", store);
            try {
            const pools : Pool[]= await store.getAll();
            console.log("pools", pools.length);
            resolve(pools);
            } catch (error) {
                reject(error);
            }
        });
    },

    async savePools(data: Pool[]) {
        const db = await openDB('cetus', 1, {
            upgrade(db: { createObjectStore: (arg0: string) => void; }) {
                db.createObjectStore('pools');
            },
        });

        const transaction = db.transaction('pools', 'readwrite');
        const store = transaction.objectStore('pools');

        data.forEach((pool) => {
            store.put(pool, pool.index);
        });
    },

    async saveData(key: string, data: any) {
      const db = await openDB('reduxToolkitQuery', 1, {
        upgrade(db: { createObjectStore: (arg0: string) => void; }) {
          db.createObjectStore('data');
        },
      });
  
      const transaction = db.transaction('data', 'readwrite');
      const store = transaction.objectStore('data');
  
      store.put(data, key);
    },
  
    async loadData(key: string) {
      const db = await openDB('reduxToolkitQuery', 1);
      const transaction = db.transaction('data', 'readonly');
      const store = transaction.objectStore('data');
  
      return store.get(key);
    },
  
    async removeData(key: string) {
      const db = await openDB('reduxToolkitQuery', 1);
      const transaction = db.transaction('data', 'readwrite');
      const store = transaction.objectStore('data');
  
      store.delete(key);
    },
  });