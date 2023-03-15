import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import { TokenConfig } from 'config/types';
import { toDecimals } from '../utils/balance';
import { TransferValidations, validateAll } from '../utils/transferValidation';
import { WalletState } from './wallet';
import { PaymentOption } from '../sdk/sdk';

export type Balances = { [key: string]: string | null };

export const formatBalance = (
  chain: ChainName,
  token: TokenConfig,
  balance: BigNumber | null,
) => {
  const decimals = chain === 'solana' ? token.solDecimals : token.decimals;
  const formattedBalance =
    balance !== null ? toDecimals(balance, decimals, 6) : null;
  return { [token.symbol]: formattedBalance };
};

export interface TransferState {
  validate: boolean;
  validations: TransferValidations;
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
  gasEst: {
    manual: string;
    automatic: string;
    claim: string;
  };
}

const initialState: TransferState = {
  validate: false,
  validations: {
    fromNetwork: '',
    toNetwork: '',
    token: '',
    amount: '',
    destGasPayment: '',
    toNativeToken: '',
    sendingWallet: '',
    receivingWallet: '',
  },
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
  gasEst: {
    manual: '',
    automatic: '',
    claim: '',
  },
};

export const transferSlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    // validations
    touchValidations: (state: TransferState) => {
      state.validate = true;
    },
    validateTransfer: (
      state: TransferState,
      { payload }: PayloadAction<WalletState>,
    ) => {
      const validations = validateAll(state, payload);
      Object.keys(validations).forEach((key) => {
        // @ts-ignore
        state.validations[key] = validations[key];
      });
    },
    // user input
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
    // transfer calculations
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
    // gas estimates
    setManualGasEst: (
      state: TransferState,
      { payload }: PayloadAction<string>,
    ) => {
      state.gasEst.manual = payload;
    },
    setAutomaticGasEst: (
      state: TransferState,
      { payload }: PayloadAction<string>,
    ) => {
      state.gasEst.automatic = payload;
    },
    setClaimGasEst: (
      state: TransferState,
      { payload }: PayloadAction<string>,
    ) => {
      state.gasEst.claim = payload;
    },
    // clear inputs
    clearTransfer: (state: TransferState) => {
      Object.keys(state).forEach((key) => {
        // @ts-ignore
        state[key] = initialState[key];
      });
    },
  },
});

export const {
  touchValidations,
  validateTransfer,
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
  setManualGasEst,
  setAutomaticGasEst,
  setClaimGasEst,
  clearTransfer,
} = transferSlice.actions;

export default transferSlice.reducer;
