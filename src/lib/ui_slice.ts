import { createSlice } from "@reduxjs/toolkit";



interface UIState {
    theme: "light" | "dark";
    menuOpen: boolean;
    poolFilters: {
        name: string;
        coinTypeA: string[];
        coinTypeB: string[];
        feeRate: [number, number];
        isPause: boolean | null;
        liquidity: [number, number];
    };
    walletFilters: {
        enabled: string[];
    };
    serverStoreBootstrapped: boolean;
}

const initialState: UIState = {
    theme: "dark",
    menuOpen: false,
    poolFilters: {
        name: "",
        coinTypeA: [],
        coinTypeB: [],
        feeRate: [0, 0],
        isPause: null,
        liquidity: [0, 0],
    },
    serverStoreBootstrapped: false,
    walletFilters: {
        enabled: ["BTC", "RUNE"],
    }
};


export const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        setTheme(state, action) {
            state.theme = action.payload;
        },
        toggleMenu(state) {
            state.menuOpen = !state.menuOpen;
        },
        setFeeRateFilter(state, action) {
            state.poolFilters.feeRate = action.payload;
        },
        setCoinTypeAFilter(state, action) {
            state.poolFilters.coinTypeA = action.payload;
        },
        setCoinTypeBFilter(state, action) {
            state.poolFilters.coinTypeB = action.payload;
        },
        setNameFilter(state, action) {
            state.poolFilters.name = action.payload;
        },
        setServerBootstrapped(state) {
            state.serverStoreBootstrapped = true;
        },
        addWalletSymbol(state, action) {
            state.walletFilters.enabled.push(action.payload)
            state.walletFilters.enabled.filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
        }, removeWalletSymbol(state, action) {
            state.walletFilters.enabled = state.walletFilters.enabled.filter((symbol) => symbol !== action.payload);
        }
    },
    selectors: {
        getTheme: (state: UIState) => state.theme,
        getMenuOpen: (state: UIState) => state.menuOpen,
        getFilters: (state: UIState) => state.poolFilters,
        getServerStoreBootstrapped: (state: UIState) => state.serverStoreBootstrapped,
        getWalletSymbols: (state: UIState) => state.walletFilters.enabled,
    }
});
