import { createSlice } from "@reduxjs/toolkit";



interface UIState {
    theme: "light" | "dark";
    menuOpen: boolean;
    filters: {
        name: string;
        coinTypeA: string[];
        coinTypeB: string[];
        feeRate: [number, number];
        isPause: boolean | null;
        liquidity: [number, number];
    };
    serverStoreBootstrapped: boolean;
}

const initialState: UIState = {
    theme: "dark",
    menuOpen: false,
    filters: {
        name: "",
        coinTypeA: [],
        coinTypeB: [],
        feeRate: [0, 0],
        isPause: null,
        liquidity: [0, 0],
    },
    serverStoreBootstrapped: false,
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
            state.filters.feeRate = action.payload;
        },
        setCoinTypeAFilter(state, action) {
            state.filters.coinTypeA = action.payload;
        },
        setCoinTypeBFilter(state, action) {
            state.filters.coinTypeB = action.payload;
        },
        setNameFilter(state, action) {
            state.filters.name = action.payload;
        },
        setServerBootstrapped(state) {
            state.serverStoreBootstrapped = true;
        }
    },
    selectors: {
        getTheme: (state: UIState) => state.theme,
        getMenuOpen: (state: UIState) => state.menuOpen,
        getFilters: (state: UIState) => state.filters,
        getServerStoreBootstrapped: (state: UIState) => state.serverStoreBootstrapped,
    }
});
