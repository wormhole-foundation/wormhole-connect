import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import { TOKENS, config } from 'config';
import { TokenConfig } from 'config/types';
import { getTokenDecimals } from 'utils';
import { toDecimals } from 'utils/balance';
import { toChainId, PayloadType } from 'utils/sdk';
import { TransferWallet, walletAcceptedNetworks } from 'utils/wallet';
import { clearWallet, setWalletError, WalletData } from './wallet';

export enum Route {
  BRIDGE = PayloadType.MANUAL, // 1
  RELAY = PayloadType.AUTOMATIC, // 3
  HASHFLOW = 10,
  COSMOS_GATEWAY = 11,
  CCTPManual = 12,
  CCTPRelay = 13,
}

export type Balances = { [key: string]: string | null };

export const formatBalance = (
  chain: ChainName,
  token: TokenConfig,
  balance: BigNumber | null,
) => {
  const decimals = getTokenDecimals(toChainId(chain), token.tokenId);
  const formattedBalance =
    balance !== null ? toDecimals(balance, decimals, 6) : null;
  return { [token.key]: formattedBalance };
};

export type ValidationErr = string;

export type TransferValidations = {
  sendingWallet: ValidationErr;
  receivingWallet: ValidationErr;
  fromNetwork: ValidationErr;
  toNetwork: ValidationErr;
  token: ValidationErr;
  destToken: ValidationErr;
  amount: ValidationErr;
  route: ValidationErr;
  toNativeToken: ValidationErr;
  foreignAsset: ValidationErr;
  associatedTokenAccount: ValidationErr;
};

export interface TransferInputState {
  validate: boolean;
  validations: TransferValidations;
  fromNetwork: ChainName | undefined;
  toNetwork: ChainName | undefined;
  token: string;
  destToken: string;
  amount: string;
  receiveAmount: string;
  route: Route;
  sourceBalances: Balances;
  destBalances: Balances;
  foreignAsset: string;
  associatedTokenAddress: string;
  gasEst: {
    manual: string;
    automatic: string;
    claim: string;
  };
  isTransactionInProgress: boolean;
  receiverNativeBalance: string | undefined;
  supportedSourceTokens: TokenConfig[];
  supportedDestTokens: TokenConfig[];
}

const initialState: TransferInputState = {
  validate: false,
  validations: {
    fromNetwork: '',
    toNetwork: '',
    token: '',
    destToken: '',
    amount: '',
    route: '',
    toNativeToken: '',
    sendingWallet: '',
    receivingWallet: '',
    foreignAsset: '',
    associatedTokenAccount: '',
  },
  fromNetwork: config?.bridgeDefaults?.fromNetwork || undefined,
  toNetwork: config?.bridgeDefaults?.toNetwork || undefined,
  token: config?.bridgeDefaults?.token || '',
  destToken: '',
  amount: '',
  receiveAmount: '',
  route: Route.BRIDGE,
  sourceBalances: {},
  destBalances: {},
  foreignAsset: '',
  associatedTokenAddress: '',
  gasEst: {
    manual: '',
    automatic: '',
    claim: '',
  },
  isTransactionInProgress: false,
  receiverNativeBalance: '',
  supportedSourceTokens: [],
  supportedDestTokens: [],
};

export const transferInputSlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    // validations
    touchValidations: (state: TransferInputState) => {
      state.validate = true;
    },
    setValidations: (
      state: TransferInputState,
      { payload }: PayloadAction<TransferValidations>,
    ) => {
      Object.keys(payload).forEach((key) => {
        // @ts-ignore
        state.validations[key] = payload[key];
      });
    },
    // user input
    setToken: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.token = payload;
    },
    setDestToken: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.destToken = payload;
    },
    setFromNetwork: (
      state: TransferInputState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      state.fromNetwork = payload;
      // clear balances if the network changes;
      state.sourceBalances = {};

      const { fromNetwork, token } = state;

      if (token) {
        const tokenConfig = TOKENS[token];
        // clear token and amount if not supported on the selected network
        if (!tokenConfig.tokenId && tokenConfig.nativeNetwork !== fromNetwork) {
          state.token = '';
          state.amount = '';
        }
      }
    },
    setToNetwork: (
      state: TransferInputState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      state.toNetwork = payload;
    },
    setAmount: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.amount = payload;
    },
    setReceiveAmount: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.receiveAmount = payload;
    },
    setBalance: (
      state: TransferInputState,
      {
        payload,
      }: PayloadAction<{ type: 'source' | 'dest'; balances: Balances }>,
    ) => {
      const { type, balances } = payload;
      if (type === 'source') {
        state.sourceBalances = { ...state.sourceBalances, ...balances };
      } else {
        state.destBalances = { ...state.destBalances, ...balances };
      }
    },
    setReceiverNativeBalance: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.receiverNativeBalance = payload;
    },
    clearBalances: (
      state: TransferInputState,
      { payload }: PayloadAction<'source' | 'dest' | 'all'>,
    ) => {
      if (payload === 'source' || payload === 'all') {
        state.sourceBalances = {};
      }

      if (payload === 'dest' || payload === 'all') {
        state.destBalances = {};
      }
    },
    setForeignAsset: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.foreignAsset = payload;
    },
    setAssociatedTokenAddress: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.associatedTokenAddress = payload;
    },
    setTransferRoute: (
      state: TransferInputState,
      { payload }: PayloadAction<Route>,
    ) => {
      state.route = payload;
    },
    // gas estimates
    setManualGasEst: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.gasEst.manual = payload;
    },
    setAutomaticGasEst: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.gasEst.automatic = payload;
    },
    setClaimGasEst: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.gasEst.claim = payload;
    },
    // clear inputs
    clearTransfer: (state: TransferInputState) => {
      Object.keys(state).forEach((key) => {
        // @ts-ignore
        state[key] = initialState[key];
      });
    },
    setIsTransactionInProgress: (
      state: TransferInputState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.isTransactionInProgress = payload;
    },
    setSupportedSourceTokens: (
      state: TransferInputState,
      { payload }: PayloadAction<TokenConfig[]>,
    ) => {
      state.supportedSourceTokens = payload;
    },
    setSupportedDestTokens: (
      state: TransferInputState,
      { payload }: PayloadAction<TokenConfig[]>,
    ) => {
      state.supportedDestTokens = payload;
    },
    swapNetworks: (state: TransferInputState) => {
      const tmp = state.fromNetwork;
      state.fromNetwork = state.toNetwork;
      state.toNetwork = tmp;
    },
  },
});

export const isDisabledNetwork = (chain: ChainName, wallet: WalletData) => {
  // Check if the wallet type (i.e. Metamask, Phantom...) is supported for the given chain
  return !walletAcceptedNetworks(wallet.type).includes(chain);
};

export const selectFromNetwork = async (
  dispatch: any,
  network: ChainName,
  wallet: WalletData,
) => {
  if (isDisabledNetwork(network, wallet)) {
    dispatch(clearWallet(TransferWallet.SENDING));
    const payload = {
      type: TransferWallet.SENDING,
      error: 'Wallet disconnected, please connect a supported wallet',
    };
    dispatch(setWalletError(payload));
  }
  dispatch(setFromNetwork(network));
};

export const selectToNetwork = async (
  dispatch: any,
  network: ChainName,
  wallet: WalletData,
) => {
  if (isDisabledNetwork(network, wallet)) {
    dispatch(clearWallet(TransferWallet.RECEIVING));
    const payload = {
      type: TransferWallet.RECEIVING,
      error: 'Wallet disconnected, please connect a supported wallet',
    };
    dispatch(setWalletError(payload));
  }
  dispatch(setToNetwork(network));
};

export const {
  touchValidations,
  setValidations,
  setToken,
  setDestToken,
  setFromNetwork,
  setToNetwork,
  setAmount,
  setReceiveAmount,
  setBalance,
  clearBalances,
  setForeignAsset,
  setAssociatedTokenAddress,
  setTransferRoute,
  setManualGasEst,
  setAutomaticGasEst,
  setClaimGasEst,
  clearTransfer,
  setIsTransactionInProgress,
  setReceiverNativeBalance,
  setSupportedDestTokens,
  setSupportedSourceTokens,
  swapNetworks,
} = transferInputSlice.actions;

export default transferInputSlice.reducer;
