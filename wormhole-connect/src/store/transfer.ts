import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import { TokenConfig } from 'config/types';
import { toDecimals } from '../utils/balance';
import { TransferValidations, validateAll } from '../utils/transferValidation';
import { WalletState } from './wallet';
import { PaymentOption } from '../sdk';
import { TOKENS } from 'config';

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
  foreignAsset: string;
  associatedTokenAddress: string;
  gasEst: {
    manual: string;
    automatic: string;
    claim: string;
  };
  isTransactionInProgress: boolean;
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
    foreignAsset: '',
    associatedTokenAccount: '',
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
  foreignAsset: '',
  associatedTokenAddress: '',
  gasEst: {
    manual: '',
    automatic: '',
    claim: '',
  },
  isTransactionInProgress: false,
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
      state.token = payload;
    },
    setFromNetwork: (
      state: TransferState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      state.fromNetwork = payload;

      const { fromNetwork, token } = state;

      if (token) {
        const tokenConfig = TOKENS[token];
        // clear token if not supported on the selected network
        if (!tokenConfig.tokenId && tokenConfig.nativeNetwork !== fromNetwork) {
          state.token = '';
        }
      }
    },
    setToNetwork: (
      state: TransferState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      state.toNetwork = payload;
    },
    setAmount: (state: TransferState, { payload }: PayloadAction<number>) => {
      state.amount = payload;
    },
    setToNativeToken: (
      state: TransferState,
      { payload }: PayloadAction<number>,
    ) => {
      state.toNativeToken = payload;
    },
    setDestGasPayment: (
      state: TransferState,
      { payload }: PayloadAction<PaymentOption>,
    ) => {
      state.destGasPayment = payload;
    },
    // transfer calculations
    setMaxSwapAmt: (
      state: TransferState,
      { payload }: PayloadAction<number | undefined>,
    ) => {
      state.maxSwapAmt = payload;
    },
    setReceiveNativeAmt: (
      state: TransferState,
      { payload }: PayloadAction<number>,
    ) => {
      state.receiveNativeAmt = payload;
    },
    setRelayerFee: (
      state: TransferState,
      { payload }: PayloadAction<number>,
    ) => {
      state.relayerFee = payload;
    },
    setBalance: (
      state: TransferState,
      { payload }: PayloadAction<Balances>,
    ) => {
      state.balances = { ...state.balances, ...payload };
    },
    clearBalances: (state: TransferState) => {
      state.balances = {};
    },
    setAutomaticRelayAvail: (
      state: TransferState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.automaticRelayAvail = payload;
      if (payload) state.destGasPayment = PaymentOption.AUTOMATIC;
    },
    setForeignAsset: (
      state: TransferState,
      { payload }: PayloadAction<string>,
    ) => {
      state.foreignAsset = payload;
    },
    setAssociatedTokenAddress: (
      state: TransferState,
      { payload }: PayloadAction<string>,
    ) => {
      state.associatedTokenAddress = payload;
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
    setIsTransactionInProgress: (
      state: TransferState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.isTransactionInProgress = payload;
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
  clearBalances,
  setAutomaticRelayAvail,
  setForeignAsset,
  setAssociatedTokenAddress,
  setManualGasEst,
  setAutomaticGasEst,
  setClaimGasEst,
  clearTransfer,
  setIsTransactionInProgress,
} = transferSlice.actions;

export default transferSlice.reducer;
