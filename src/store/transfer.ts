import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName, ChainConfig, TokenConfig } from 'sdk';
import MAINNET_CONFIG, { MAINNET_TOKENS } from 'sdk/config/MAINNET';
import TESTNET_CONFIG, { TESTNET_TOKENS } from 'sdk/config/TESTNET';

const env = 'TESTNET'; // TODO: get from env
export const CONFIG = env === 'TESTNET' ? TESTNET_CONFIG : MAINNET_CONFIG;
export const CHAINS = CONFIG.chains;
export const CHAINS_ARR = Object.values(CHAINS) as ChainConfig[];
export const TOKENS = env === 'TESTNET' ? TESTNET_TOKENS : MAINNET_TOKENS;
export const TOKENS_ARR = Object.values(TOKENS) as TokenConfig[];

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
}

const initialState: TransferState = {
  fromNetwork: undefined,
  toNetwork: undefined,
  token: '',
  amount: undefined,
  // TODO: check if automatic is available once networks and token are selected
  destGasPayment: PaymentOption.AUTOMATIC,
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
    setDestGasPayment: (
      state: TransferState,
      { payload }: PayloadAction<PaymentOption>,
    ) => {
      console.log('set destination gas payment option:', payload);
      state.destGasPayment = payload;
    },
  },
});

export const {
  setToken,
  setFromNetwork,
  setToNetwork,
  setDestGasPayment,
  setAmount,
} = transferSlice.actions;

export default transferSlice.reducer;
