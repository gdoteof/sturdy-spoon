'use client'
import { MutableRefObject, useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore, AppStore } from '../lib/store'
import { PersistGate } from 'redux-persist/integration/react'
import { Persistor, persistStore } from 'redux-persist'

export default function StoreProvider({
  children
}: {
  children: React.ReactNode
}) {
  const storeRef = useRef<AppStore>()
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore()
  }

  const persistorRef = useRef<Persistor>()
  if (!persistorRef.current) {
    persistorRef.current = persistStore(storeRef.current)
  }

  return <Provider store={storeRef.current}>
    <PersistGate persistor={persistorRef.current}>
      {children}
    </PersistGate>
  </Provider>
}