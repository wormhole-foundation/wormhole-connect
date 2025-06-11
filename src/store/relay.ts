import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TokenTuple } from 'config/tokens';

export interface RelayerFee {
  fee: number;
  token?: TokenTuple; // the token that the fee is paid in
}

export interface RelayState {
  maxSwapAmt: number | undefined;
  toNativeToken: number;
  receiveNativeAmt: number | undefined;
  relayerFee: RelayerFee | undefined;
  receiverNativeBalance: string | undefined;
}

const initialState: RelayState = {
  maxSwapAmt: undefined,
  toNativeToken: 0,
  receiveNativeAmt: undefined,
  relayerFee: undefined,
  receiverNativeBalance: '',
};

export const relaySlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    setToNativeToken: (
      state: RelayState,
      { payload }: PayloadAction<number>,
    ) => {
      state.toNativeToken = payload;
    },
    // clear relay state
    clearRelay: (state: RelayState) => {
      Object.keys(state).forEach((key) => {
        // @ts-ignore
        state[key] = initialState[key];
      });
    },
  },
});

export const { setToNativeToken } = relaySlice.actions;

export default relaySlice.reducer;
