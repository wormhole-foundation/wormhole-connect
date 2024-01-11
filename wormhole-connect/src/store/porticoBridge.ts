import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DataWrapper,
  errorDataWrapper,
  fetchDataWrapper,
  getEmptyDataWrapper,
  receiveDataWrapper,
} from './helpers';

export interface PorticoSwapAmounts {
  minAmountStart: string;
  minAmountFinish: string;
  amountFinish: string;
}

export interface PorticoBridgeState {
  relayerFee: DataWrapper<string>;
  swapAmounts: DataWrapper<PorticoSwapAmounts>;
}

const initialState: PorticoBridgeState = {
  relayerFee: getEmptyDataWrapper(),
  swapAmounts: getEmptyDataWrapper(),
};

export const porticoBridgeSlice = createSlice({
  name: 'porticoBridge',
  initialState,
  reducers: {
    setRelayerFee: (
      state: PorticoBridgeState,
      { payload }: PayloadAction<string>,
    ) => {
      state.relayerFee = receiveDataWrapper(payload);
    },
    setFetchingRelayerFee: (state: PorticoBridgeState) => {
      state.relayerFee = fetchDataWrapper();
    },
    setRelayerFeeError: (
      state: PorticoBridgeState,
      { payload }: PayloadAction<string>,
    ) => {
      state.relayerFee = errorDataWrapper(payload);
    },
    resetRelayerFee: (state: PorticoBridgeState) => {
      state.relayerFee = getEmptyDataWrapper();
    },
    setSwapAmounts: (
      state: PorticoBridgeState,
      { payload }: PayloadAction<PorticoSwapAmounts>,
    ) => {
      state.swapAmounts = receiveDataWrapper(payload);
    },
    setFetchingSwapAmounts: (state: PorticoBridgeState) => {
      state.swapAmounts = fetchDataWrapper();
    },
    setSwapAmountsError: (
      state: PorticoBridgeState,
      { payload }: PayloadAction<string>,
    ) => {
      state.swapAmounts = errorDataWrapper(payload);
    },
    resetSwapAmounts: (state: PorticoBridgeState) => {
      state.swapAmounts = getEmptyDataWrapper();
    },
    clearPorticoBridge: () => initialState,
  },
});

export const {
  setRelayerFee,
  setFetchingRelayerFee,
  setRelayerFeeError,
  resetRelayerFee,
  setSwapAmounts,
  setFetchingSwapAmounts,
  setSwapAmountsError,
  resetSwapAmounts,
  clearPorticoBridge,
} = porticoBridgeSlice.actions;

export default porticoBridgeSlice.reducer;
