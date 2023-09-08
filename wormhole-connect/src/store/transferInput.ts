import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import { TOKENS, config } from 'config';
import { Route, TokenConfig } from 'config/types';
import { getTokenDecimals } from 'utils';
import { toDecimals } from 'utils/balance';
import { toChainId } from 'utils/sdk';
import { TransferWallet, walletAcceptedChains } from 'utils/wallet';
import { clearWallet, setWalletError, WalletData } from './wallet';

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
  fromChain: ValidationErr;
  toChain: ValidationErr;
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
  availableRoutes: string[];
  fromChain: ChainName | undefined;
  toChain: ChainName | undefined;
  token: string;
  destToken: string;
  amount: string;
  receiveAmount: string;
  route: Route | undefined;
  sourceBalances: Balances;
  destBalances: Balances;
  foreignAsset: string;
  associatedTokenAddress: string;
  gasEst: {
    send: string;
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
    fromChain: '',
    toChain: '',
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
  availableRoutes: [],
  fromChain: config?.bridgeDefaults?.fromNetwork || undefined,
  toChain: config?.bridgeDefaults?.toNetwork || undefined,
  token: config?.bridgeDefaults?.token || '',
  destToken: '',
  amount: '',
  receiveAmount: '',
  route: undefined,
  sourceBalances: {},
  destBalances: {},
  foreignAsset: '',
  associatedTokenAddress: '',
  gasEst: {
    send: '',
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
    setAvailableRoutes: (
      state: TransferInputState,
      { payload }: PayloadAction<string[]>,
    ) => {
      state.availableRoutes = payload;
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
    setFromChain: (
      state: TransferInputState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      state.fromChain = payload;
      // clear balances if the chain changes;
      state.sourceBalances = {};

      const { fromChain, token } = state;

      if (token) {
        const tokenConfig = TOKENS[token];
        // clear token and amount if not supported on the selected chain
        if (!tokenConfig.tokenId && tokenConfig.nativeChain !== fromChain) {
          state.token = '';
          state.amount = '';
        }
      }
    },
    setToChain: (
      state: TransferInputState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      state.toChain = payload;
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
      { payload }: PayloadAction<Route | undefined>,
    ) => {
      if (!payload) {
        state.route = undefined;
        return;
      }
      if (state.availableRoutes.includes(payload)) {
        state.route = payload;
      } else {
        state.route = undefined;
      }
    },
    // gas estimates
    setSendingGasEst: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.gasEst.send = payload;
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
    swapChains: (state: TransferInputState) => {
      const tmp = state.fromChain;
      state.fromChain = state.toChain;
      state.toChain = tmp;
    },
  },
});

export const isDisabledChain = (chain: ChainName, wallet: WalletData) => {
  // Check if the wallet type (i.e. Metamask, Phantom...) is supported for the given chain
  return !walletAcceptedChains(wallet.type).includes(chain);
};

export const selectFromChain = async (
  dispatch: any,
  chain: ChainName,
  wallet: WalletData,
) => {
  if (isDisabledChain(chain, wallet)) {
    dispatch(clearWallet(TransferWallet.SENDING));
    const payload = {
      type: TransferWallet.SENDING,
      error: 'Wallet disconnected, please connect a supported wallet',
    };
    dispatch(setWalletError(payload));
  }
  dispatch(setFromChain(chain));
};

export const selectToChain = async (
  dispatch: any,
  chain: ChainName,
  wallet: WalletData,
) => {
  if (isDisabledChain(chain, wallet)) {
    dispatch(clearWallet(TransferWallet.RECEIVING));
    const payload = {
      type: TransferWallet.RECEIVING,
      error: 'Wallet disconnected, please connect a supported wallet',
    };
    dispatch(setWalletError(payload));
  }
  dispatch(setToChain(chain));
};

export const {
  touchValidations,
  setValidations,
  setAvailableRoutes,
  setToken,
  setDestToken,
  setFromChain,
  setToChain,
  setAmount,
  setReceiveAmount,
  setBalance,
  clearBalances,
  setForeignAsset,
  setAssociatedTokenAddress,
  setTransferRoute,
  setSendingGasEst,
  setClaimGasEst,
  clearTransfer,
  setIsTransactionInProgress,
  setReceiverNativeBalance,
  setSupportedDestTokens,
  setSupportedSourceTokens,
  swapChains,
} = transferInputSlice.actions;

export default transferInputSlice.reducer;
