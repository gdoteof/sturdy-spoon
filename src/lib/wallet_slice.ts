
import { btcAPI } from "@/lib/btc_slice";
import { AddressWithBalance, KeystoneAccount, keystoneApi, KeystoneMultiAccount } from "@/lib/keystone_api";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

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
        setBalanceForAddress: (state, action: PayloadAction<{ address: string, balance: number }>) => {
            const activeWallet = state.wallets[state.activeWallet ?? ""];
            if (!activeWallet) {
                return;
            }
            const coinAccounts = activeWallet.coinAccounts;
            coinAccounts.forEach((account) => {
                const address = account.derivedAddresses.find((address) => address.address === action.payload.address);
                if (address) {
                    address.balance = action.payload.balance;
                    return;
                }
            });
        }
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
        builder.addMatcher(btcAPI.endpoints.checkBalance.matchFulfilled, (state, action) => {
            const balance = action.payload;
            const originalAddress = action.meta.arg.originalArgs;
            console.log(`Balance for address ${originalAddress} is ${action.payload}`);
            const activeWallet = state.wallets[state.activeWallet ?? ""];
            if (!activeWallet) {
                return;
            }
            const coinAccounts = activeWallet.coinAccounts;
            console.log(`Original Address: ${originalAddress}`);
            console.log(`Number of coin accounts: ${coinAccounts.length}`);
            coinAccounts.forEach((account, accountIndex) => {
                console.log(`Account: ${account.chain}`);
                console.log(`Number of addresses: ${account.derivedAddresses.length}`);
                const addressIndex = account.derivedAddresses.findIndex((address) => address.address === originalAddress);
                if (addressIndex !== -1) {
                    console.log(`Setting balance for address ${originalAddress} to ${balance}, inside BTC slice`);
                    console.log(state.wallets[state.activeWallet ?? ""].coinAccounts[accountIndex].derivedAddresses[addressIndex]);
                    state.wallets[state.activeWallet ?? ""].coinAccounts[accountIndex].derivedAddresses[addressIndex].balance = balance;
                    return state;
                }
            });
            return state;
        }
        );
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