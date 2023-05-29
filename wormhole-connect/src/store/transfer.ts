import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import { TokenConfig } from 'config/types';
import { toDecimals } from '../utils/balance';
import { TransferValidations } from '../utils/transferValidation';
import { PaymentOption } from '../sdk';
import { TOKENS, config } from 'config';

export type Balances = { [key: string]: string | null };

export const formatBalance = (
  chain: ChainName,
  token: TokenConfig,
  balance: BigNumber | null,
) => {
  const decimals =
    chain === 'solana'
      ? token.solDecimals
      : chain === 'sui'
      ? token.suiDecimals
      : token.decimals;
  const formattedBalance =
    balance !== null ? toDecimals(balance, decimals, 6) : null;
  return { [token.key]: formattedBalance };
};

export interface TransferState {
  validate: boolean;
  validations: TransferValidations;
  fromNetwork: ChainName | undefined;
  toNetwork: ChainName | undefined;
  automaticRelayAvail: boolean;
  token: string;
  destToken: string;
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
  receiverNativeBalance: string | undefined;
}

const initialState: TransferState = {
  validate: false,
  validations: {
    fromNetwork: '',
    toNetwork: '',
    token: '',
    destToken: '',
    amount: '',
    destGasPayment: '',
    toNativeToken: '',
    sendingWallet: '',
    receivingWallet: '',
    foreignAsset: '',
    associatedTokenAccount: '',
  },
  fromNetwork: config?.bridgeDefaults?.fromNetwork || undefined,
  toNetwork: config?.bridgeDefaults?.toNetwork || undefined,
  automaticRelayAvail: false,
  token: config?.bridgeDefaults?.token || '',
  destToken: '',
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
  receiverNativeBalance: '',
};

export const transferSlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    // validations
    touchValidations: (state: TransferState) => {
      state.validate = true;
    },
    setValidations: (
      state: TransferState,
      { payload }: PayloadAction<TransferValidations>,
    ) => {
      Object.keys(payload).forEach((key) => {
        // @ts-ignore
        state.validations[key] = payload[key];
      });
    },
    // user input
    setToken: (state: TransferState, { payload }: PayloadAction<string>) => {
      state.token = payload;
    },
    setDestToken: (
      state: TransferState,
      { payload }: PayloadAction<string>,
    ) => {
      state.destToken = payload;
    },
    setFromNetwork: (
      state: TransferState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      state.fromNetwork = payload;
      // clear balances if the network changes;
      state.balances = {};

      const { fromNetwork, token } = state;

      if (token) {
        const tokenConfig = TOKENS[token];
        // clear token and amount if not supported on the selected network
        if (!tokenConfig.tokenId && tokenConfig.nativeNetwork !== fromNetwork) {
          state.token = '';
          state.amount = undefined;
        }
      }
    },
    setToNetwork: (
      state: TransferState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      state.toNetwork = payload;
    },
    setAmount: (
      state: TransferState,
      { payload }: PayloadAction<number | undefined>,
    ) => {
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
      if (payload === PaymentOption.MANUAL) {
        state.maxSwapAmt = undefined;
      }
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
    setReceiverNativeBalance: (
      state: TransferState,
      { payload }: PayloadAction<string>,
    ) => {
      state.receiverNativeBalance = payload;
    },
    clearBalances: (state: TransferState) => {
      state.balances = {};
    },
    enableAutomaticTransfer: (state: TransferState) => {
      state.automaticRelayAvail = true;
      state.destGasPayment = PaymentOption.AUTOMATIC;
    },
    disableAutomaticTransfer: (state: TransferState) => {
      state.automaticRelayAvail = false;
      state.destGasPayment = PaymentOption.MANUAL;
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
  setValidations,
  setToken,
  setDestToken,
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
  enableAutomaticTransfer,
  disableAutomaticTransfer,
  setForeignAsset,
  setAssociatedTokenAddress,
  setManualGasEst,
  setAutomaticGasEst,
  setClaimGasEst,
  clearTransfer,
  setIsTransactionInProgress,
  setReceiverNativeBalance,
} = transferSlice.actions;

export default transferSlice.reducer;
