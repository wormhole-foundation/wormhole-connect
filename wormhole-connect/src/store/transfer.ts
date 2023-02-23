import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { TokenConfig } from 'config/types';
import { BigNumber } from 'ethers';
import { toDecimals } from 'utils/balance';

export enum PaymentOption {
  MANUAL = 1,
  AUTOMATIC = 3,
}
export type Balances = { [key: string]: string | null };

export const formatBalance = (
  token: TokenConfig,
  balance: BigNumber | null,
) => {
  const formattedBalance =
    balance !== null ? toDecimals(balance, token.decimals, 6) : null;
  return { [token.symbol]: formattedBalance };
};

export interface TransferState {
  fromNetwork: ChainName | undefined;
  toNetwork: ChainName | undefined;
  automaticRelayAvail: boolean;
  token: string;
  amount: number | undefined;
  destGasPayment: PaymentOption;
  maxSwapAmt: number | undefined;
  toNativeToken: number;
  receiveNativeAmt: number | undefined;
  relayerFee: number | undefined;
  balances: Balances;
}

const initialState: TransferState = {
  fromNetwork: undefined,
  toNetwork: undefined,
  automaticRelayAvail: false,
  token: '',
  amount: undefined,
  destGasPayment: PaymentOption.MANUAL,
  maxSwapAmt: undefined,
  toNativeToken: 0,
  receiveNativeAmt: undefined,
  relayerFee: undefined,
  balances: {},
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
    setToNativeToken: (
      state: TransferState,
      { payload }: PayloadAction<number>,
    ) => {
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
      { payload }: PayloadAction<number>,
    ) => {
      console.log('set max swap amount:', payload);
      state.maxSwapAmt = payload;
    },
    setReceiveNativeAmt: (
      state: TransferState,
      { payload }: PayloadAction<number>,
    ) => {
      console.log('set receive native token amount:', payload);
      state.receiveNativeAmt = payload;
    },
    setRelayerFee: (
      state: TransferState,
      { payload }: PayloadAction<number>,
    ) => {
      console.log('set relayer fee', payload);
      state.relayerFee = payload;
    },
    setBalance: (
      state: TransferState,
      { payload }: PayloadAction<Balances>,
    ) => {
      state.balances = { ...state.balances, ...payload };
    },
    setAutomaticRelayAvail: (
      state: TransferState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.automaticRelayAvail = payload;
      if (payload) state.destGasPayment = PaymentOption.AUTOMATIC;
    },
    clearTransfer: (state: TransferState) => {
      state = initialState;
    },
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
  setRelayerFee,
  setBalance,
  setAutomaticRelayAvail,
  clearTransfer,
} = transferSlice.actions;

export default transferSlice.reducer;
