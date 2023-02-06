import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

export enum PaymentOption {
  MANUAL = 1,
  AUTOMATIC = 2,
}
export interface TransferState {
  fromNetwork: ChainName | undefined;
  toNetwork: ChainName | undefined;
  token: string;
  amount: number | undefined;
  destGasPayment: PaymentOption;
  maxSwapAmt: number | undefined;
  toNativeToken: number;
  receiveNativeAmt: number | undefined;
  txHash: string;
  redeemTx: string;
}

const initialState: TransferState = {
  fromNetwork: undefined,
  toNetwork: undefined,
  token: '',
  amount: undefined,
  // TODO: check if automatic is available once networks and token are selected
  destGasPayment: PaymentOption.AUTOMATIC,
  maxSwapAmt: undefined,
  toNativeToken: 0,
  receiveNativeAmt: undefined,
  txHash: '',
  redeemTx: '',
};

export const transferSlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    setToken: (state: TransferState, { payload }: PayloadAction<string>) => {
      console.log('set token:', payload);
      state.token = payload;
    },
    setFromNetwork: (
      state: TransferState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      console.log('set from network:', payload);
      state.fromNetwork = payload;
    },
    setToNetwork: (
      state: TransferState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      console.log('set to network:', payload);
      state.toNetwork = payload;
    },
    setAmount: (state: TransferState, { payload }: PayloadAction<number>) => {
      console.log('set amount:', payload);
      state.amount = payload;
    },
    setToNativeToken: (state: TransferState, { payload }: PayloadAction<number>) => {
      console.log('set toNativeToken amount:', payload);
      state.toNativeToken = payload;
    },
    setDestGasPayment: (
      state: TransferState,
      { payload }: PayloadAction<PaymentOption>,
    ) => {
      console.log('set destination gas payment option:', payload);
      state.destGasPayment = payload;
    },
    setMaxSwapAmt: (
      state: TransferState,
      {payload}: PayloadAction<number>,
    ) => {
      console.log('set max swap amount:', payload);
      state.maxSwapAmt = payload;
    },
    setReceiveNativeAmt: (
      state: TransferState,
      {payload}: PayloadAction<number>,
    ) => {
      console.log('set receive native token amount:', payload);
      state.receiveNativeAmt = payload;
    },
    setTxHash: (state: TransferState, { payload }: PayloadAction<string>) => {
      console.log('set tx hash:', payload);
      state.txHash = payload;
    },
    setRedeemTx: (state: TransferState, { payload }) => {
      console.log('set redeem tx:', payload);
      state.redeemTx = payload;
    }
  },
});

export const {
  setToken,
  setFromNetwork,
  setToNetwork,
  setDestGasPayment,
  setAmount,
  setToNativeToken,
  setMaxSwapAmt,
  setReceiveNativeAmt,
  setTxHash,
  setRedeemTx,
} = transferSlice.actions;

export default transferSlice.reducer;
