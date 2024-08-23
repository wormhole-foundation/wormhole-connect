import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RelayerFee {
  fee: number;
  tokenKey: string; // key of the token that the fee is paid in
}

export interface RelayState {
  maxSwapAmt: number | undefined;
  toNativeToken: number;
  receiveNativeAmt: number | undefined;
  relayerFee: RelayerFee | undefined;
  receiverNativeBalance: string | undefined;
  eta: number;
}

const initialState: RelayState = {
  maxSwapAmt: undefined,
  toNativeToken: 0,
  receiveNativeAmt: undefined,
  relayerFee: undefined,
  receiverNativeBalance: '',
  eta: 0,
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
    setReceiveNativeAmt: (
      state: RelayState,
      { payload }: PayloadAction<number>,
    ) => {
      state.receiveNativeAmt = payload;
    },
    setRelayerFee: (
      state: RelayState,
      { payload }: PayloadAction<RelayerFee | undefined>,
    ) => {
      state.relayerFee = payload;
    },
    setReceiverNativeBalance: (
      state: RelayState,
      { payload }: PayloadAction<string>,
    ) => {
      state.receiverNativeBalance = payload;
    },
    setEta: (state: RelayState, { payload }: PayloadAction<number>) => {
      state.eta = payload;
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

export const {
  setToNativeToken,
  setReceiveNativeAmt,
  setRelayerFee,
  setReceiverNativeBalance,
  setEta,
} = relaySlice.actions;

export default relaySlice.reducer;
