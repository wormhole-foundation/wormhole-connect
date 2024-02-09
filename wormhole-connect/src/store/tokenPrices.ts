import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DataWrapper,
  errorDataWrapper,
  fetchDataWrapper,
  getEmptyDataWrapper,
  receiveDataWrapper,
} from './helpers';
export type TokenPrices = { [key: string]: { usd: number } };

export interface TokenPricesState {
  usdPrices: DataWrapper<TokenPrices>;
}

const initialState: TokenPricesState = {
  usdPrices: getEmptyDataWrapper(),
};

export const tokenPricesSlice = createSlice({
  name: 'tokenPrices',
  initialState,
  reducers: {
    setPrices: (
      state: TokenPricesState,
      { payload }: PayloadAction<TokenPrices>,
    ) => {
      state.usdPrices = receiveDataWrapper(payload);
    },
    setFetchingPrices: (state: TokenPricesState) => {
      state.usdPrices = fetchDataWrapper();
    },
    setPricesError: (
      state: TokenPricesState,
      { payload }: PayloadAction<string>,
    ) => {
      state.usdPrices = errorDataWrapper(payload);
    },
    resetPrices: (state: TokenPricesState) => {
      state.usdPrices = getEmptyDataWrapper();
    },
    clearTokenPrices: () => initialState,
  },
});

export const {
  setPrices,
  setFetchingPrices,
  setPricesError,
  resetPrices,
  clearTokenPrices,
} = tokenPricesSlice.actions;

export default tokenPricesSlice.reducer;
