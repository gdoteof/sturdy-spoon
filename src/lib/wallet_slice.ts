import { getBtcAddressFromKeyObj, getThorchainAddressFromKeyObj } from "@/app/swap/utils/chainHelpers";
import { getBtcBalance, getThorBalance } from "@/lib/thor_slice";
import KeystoneSDK, { UR } from "@keystonehq/keystone-sdk";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";

export enum WalletType {
    KEYSTONE = "KEYSTONE",
    LEDGER = "LEDGER",
}

export enum SwappableChains {
    BTC = "BITCOIN",
    THOR = "THORCHAIN",
    SOL = "SOLANA",
}

export type SwappableChain = keyof typeof SwappableChains;

export enum SwappableSymbols {
    RUNE = "RUNE",
    BTC = "BTC",
}

export type SwappableSymbol = keyof typeof SwappableSymbols;

export interface CoinAccount {
    chain: SwappableChain;
    symbol: SwappableSymbol;
    balance: number;
    derivedAddresses: AddressWithBalance[];
    index: number;
    derivationPath: string;
}
export interface WalletState {
    wallets: Record<string, Wallet>;
    activeWallet: string | null;
    isScanning: boolean;
    scanProgress: number;
    keystoneMultiAccounts: Record<string, KeystoneMultiAccount>;
}
import { Account, MultiAccounts } from "@keystonehq/keystone-sdk";

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

interface AddressWithBalance {
    address: string;
    balance: number;
    index: number;
}
export type KeystoneAccount = Account & AddressInfo;

export type KeystoneMultiAccount = Omit<MultiAccounts, "keys"> & {
    keys: KeystoneAccount[];
};

export interface Wallet {
    walletType: WalletType;
    coinAccounts: CoinAccount[];
    enabledChains: SwappableChain[];
    enabledCoins: SwappableSymbol[];
    masterFingerprint: string;
}

const initialState: WalletState = {
    wallets: {},
    activeWallet: null,
    isScanning: false,
    scanProgress: 0,
    keystoneMultiAccounts: {},
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
                    const keystoneAccountPromises = accounts.keys.map(async (account, accountIndex) => {
                        if (account.chain === 'RUNE') {
                            const derivedAddresses: AddressWithBalance[] = [];
                            let balance = 0;
                            for (let i = 0; i < 5; i++) {
                                const address = getThorchainAddressFromKeyObj(account, i);
                                const thisBalance = await getThorBalance(address);
                                balance += thisBalance;
                                derivedAddresses.push({ address, balance: thisBalance, index: i });
                            }
                            return { ...account, derivedAddresses, balance, index: accountIndex } as KeystoneAccount;
                        }
                        else if (account.chain === 'BTC') {
                            const derivedAddresses: AddressWithBalance[] = [];
                            let balance = 0;
                            for (let i = 0; i < 5; i++) {
                                const address = getBtcAddressFromKeyObj(account, i);
                                const thisBalance = await getBtcBalance(address);
                                balance += thisBalance;
                                derivedAddresses.push({ address, balance: thisBalance, index: i });
                            }
                            return { ...account, derivedAddresses, balance };
                        }
                        else {
                            console.log('Unsupported chain:', account.chain);
                        }
                        return { ...account, balance: 0, derivedAddresses: [] };
                    }
                    );
                    const keystoneAccounts = await Promise.all(keystoneAccountPromises);
                    const keystoneMultiAccounts = { ...accounts, keys: keystoneAccounts };

                    return { data: keystoneMultiAccounts as KeystoneMultiAccount };
                } catch (error) {
                    return { error: { status: 'CUSTOM_ERROR', error: 'Failed to process Keystone scan', data: { message: 'Failed to process Keystone scan' } } };
                }
            },

        })
    })
});


export const walletSlice = createSlice({
    name: "wallet",
    initialState,
    reducers: {
        setActiveWallet: (state, action: PayloadAction<string>) => {
            state.activeWallet = action.payload;
        },
        setWallets: (state, action: PayloadAction<Record<string, Wallet>>) => {
            state.wallets = action.payload;
        },
        setWallet: (state, action: PayloadAction<Wallet>) => {
            state.wallets[action.payload.masterFingerprint] = action.payload;
            if (state.activeWallet === null) {
                state.activeWallet = action.payload.masterFingerprint;
            }
        },
        setCoinAccounts: (state, action: PayloadAction<CoinAccount[]>) => {
            state.wallets[state.activeWallet!].coinAccounts = action.payload;
        },
        setEnabledChains: (state, action: PayloadAction<SwappableChain[]>) => {
            state.wallets[state.activeWallet!].enabledChains = action.payload;
        },
        setEnabledCoins: (state, action: PayloadAction<SwappableSymbol[]>) => {
            state.wallets[state.activeWallet!].enabledCoins = action.payload;
        },
        setIsScanning: (state, action: PayloadAction<boolean>) => {
            state.isScanning = action.payload;
        },
        setScanProgress: (state, action: PayloadAction<number>) => {
            state.scanProgress = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addMatcher(keystoneApi.endpoints.processKeystoneScan.matchFulfilled, (state, action) => {
            const incomingCoinAccounts: CoinAccount[] = action.payload.keys.map((key: KeystoneAccount, index: number) => {
                return {
                    chain: key.chain as SwappableChain,
                    symbol: key.name as SwappableSymbol,
                    balance: key.balance,
                    derivedAddresses: key.derivedAddresses,
                    derivationPath: key.path,
                    index: 0,
                };
            });
            state.wallets[action.payload.masterFingerprint] = {
                walletType: WalletType.KEYSTONE,
                coinAccounts: incomingCoinAccounts,
                enabledChains: [],
                enabledCoins: [],
                masterFingerprint: action.payload.masterFingerprint,
            };
            if (state.activeWallet === null) {
                state.activeWallet = action.payload.masterFingerprint;
            }
            state.keystoneMultiAccounts[action.payload.masterFingerprint] = action.payload;
            return state;
        });
    },

    selectors: {
        selectWallet: (state: WalletState) => state.wallets[state.activeWallet ?? ""] ?? null,
        selectIsScanning: (state: WalletState) => state.isScanning,
        selectScanProgress: (state: WalletState) => state.scanProgress,
        selectNumWallets: (state: WalletState) => Object.keys(state.wallets).length,
        selectWallets: (state: WalletState) => state.wallets,
        selectActiveWalletFingerprint: (state: WalletState) => {
            return state.activeWallet;
        },
        selectWalletWithoutEmptyAccounts: (state: WalletState) => {
            const activeWallet = state.wallets[state.activeWallet ?? ""];
            if (!activeWallet) {
                return null;
            }
            const coinAccounts = activeWallet.coinAccounts.filter((account) => account.balance > 0);
            return {
                ...activeWallet,
                coinAccounts,
            } as Wallet;
        },
        selectAddressesWithNonZeroBalance: (state: WalletState) => {
            const activeWallet = state.wallets[state.activeWallet ?? ""];
            if (!activeWallet) {
                return [] as string[];
            }
            const addresses = activeWallet.coinAccounts.flatMap((account) => account.derivedAddresses);
            const nonZeroAddresses = addresses.filter((address) => address.balance > 0);
            return nonZeroAddresses.map((address) => address.address);
        },
        selectFirstAndNonZeroAddresses: (state: WalletState) => {
            const activeWallet = state.wallets[state.activeWallet ?? ""];
            if (!activeWallet) {
                return undefined;
            }
            const addresses = activeWallet.coinAccounts.flatMap((account) => account.derivedAddresses);
            const nonZeroAddresses = addresses.filter((address) => address.balance > 0);
            const firstAddressFromEachCoin = activeWallet.coinAccounts.map((account) => account.derivedAddresses[0]).filter(
                (address) => address !== undefined
            );
            return firstAddressFromEachCoin.concat(nonZeroAddresses).map((address) => address.address);
        },
        selectCoinAccountsWithKnownAddresses: (state: WalletState) => {
            const activeWallet = state.wallets[state.activeWallet ?? ""];
            if (!activeWallet) {
                return [] as CoinAccount[];
            }
            const coinAccounts: CoinAccount[] = activeWallet.coinAccounts.filter((account) => account.derivedAddresses.length > 0);
            return coinAccounts;
        },
        selectNumCoinAccounts: (state: WalletState) => {
            const activeWallet = state.wallets[state.activeWallet ?? ""];
            if (!activeWallet) {
                return 0;
            }
            return activeWallet.coinAccounts.length;
        },
        selectWalletFingerPrints: (state: WalletState) => {
            return Object.keys(state.wallets)
        }


    }
});