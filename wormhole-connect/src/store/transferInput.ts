import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import config from 'config';
import { Token, TokenTuple } from 'config/tokens';
import { TransferWallet, walletAcceptedChains } from 'utils/wallet';
import { clearWallet, setWalletError, WalletData } from './wallet';
import {
  DataWrapper,
  errorDataWrapper,
  fetchDataWrapper,
  getEmptyDataWrapper,
  receiveDataWrapper,
} from './helpers';
import { Chain, amount } from '@wormhole-foundation/sdk';
import { NonSDKChain } from 'config/types';

export type Balance = {
  lastUpdated: number;
  balance: amount.Amount | null;
};
export type Balances = { [key: string]: Balance };
export type ChainBalances = {
  balances: Balances;
};
export type BalancesCache = { [key in Chain]?: ChainBalances };
type WalletAddress = string;
export type WalletBalances = { [key: WalletAddress]: BalancesCache };

export const accessChainBalances = (
  balances: WalletBalances | undefined,
  walletAddress: WalletAddress | undefined,
  chain: Chain | undefined,
): ChainBalances | undefined => {
  if (!chain || !balances || !walletAddress) return undefined;
  const walletBalances = balances[walletAddress];
  if (!walletBalances) return undefined;
  const chainBalances = walletBalances[chain];
  if (!chainBalances) return undefined;
  return chainBalances;
};

export const accessBalance = (
  balances: WalletBalances | undefined,
  walletAddress: WalletAddress | undefined,
  chain: Chain | undefined,
  token: Token,
): Balance | undefined => {
  const chainBalances = accessChainBalances(balances, walletAddress, chain);
  if (!chainBalances) return undefined;
  return chainBalances.balances[token.key];
};

export type ValidationErr = string;

export type TransferValidations = {
  sendingWallet: ValidationErr;
  receivingWallet: ValidationErr;
  fromChain: ValidationErr;
  toChain: ValidationErr;
  amount: ValidationErr;
  toNativeToken: ValidationErr;
  relayerFee: ValidationErr;
  receiveAmount: ValidationErr;
};

export interface TransferInputState {
  showValidationState: boolean;
  validations: TransferValidations;
  fromChain: Chain | undefined;
  toChain: Chain | undefined;
  toNonSDKChain: NonSDKChain | undefined;
  token: TokenTuple | undefined;
  destToken: TokenTuple | undefined;
  amount?: amount.Amount;
  receiveAmount: DataWrapper<string>;
  route?: string;
  preferredRouteName?: string | undefined;
  balances: WalletBalances;
  foreignAsset: string;
  associatedTokenAddress: string;
  gasEst: {
    send: string;
    claim: string;
  };
  isTransactionInProgress: boolean;
  receiverNativeBalance: string | undefined;
  supportedSourceTokens: TokenTuple[];
}

// This is a function because config might have changed since we last cleared this store
function getInitialState(): TransferInputState {
  const { fromChain, toChain, toNonSDKChain, fromToken, toToken } =
    config.ui.defaultInputs || {};

  const fromTokenTuple =
    fromChain && fromToken
      ? config.tokens.findByAddressOrSymbol(fromChain, fromToken)?.tuple
      : undefined;
  const toTokenTuple =
    toChain && toToken
      ? config.tokens.findByAddressOrSymbol(toChain, toToken)?.tuple
      : undefined;

  return {
    showValidationState: false,
    validations: {
      fromChain: '',
      toChain: '',
      amount: '',
      toNativeToken: '',
      sendingWallet: '',
      receivingWallet: '',
      relayerFee: '',
      receiveAmount: '',
    },
    fromChain,
    toChain,
    toNonSDKChain,
    token: fromTokenTuple,
    destToken: toTokenTuple,
    amount: undefined,
    receiveAmount: getEmptyDataWrapper(),
    preferredRouteName: config.ui.defaultInputs?.preferredRouteName,
    route: undefined,
    balances: {},
    foreignAsset: '',
    associatedTokenAddress: '',
    gasEst: {
      send: '',
      claim: '',
    },
    isTransactionInProgress: false,
    receiverNativeBalance: '',
    supportedSourceTokens: [],
  };
}

const performModificationsIfFromChainChanged = (state: TransferInputState) => {
  const { fromChain } = state;

  if (state.token) {
    const token = config.tokens.get(state.token);
    if (token && fromChain) {
      if (token.chain !== fromChain && token.symbol) {
        const withSameSymbol = config.tokens.findBySymbol(
          fromChain,
          token.symbol,
        );

        if (withSameSymbol) {
          state.token = withSameSymbol.tuple;
        }
      }
    }
  }
};

const performModificationsIfToChainChanged = (state: TransferInputState) => {
  const { toChain } = state;

  if (state.destToken) {
    const destToken = config.tokens.get(state.destToken);
    if (destToken && toChain) {
      if (destToken.chain !== toChain && destToken.symbol) {
        const withSameSymbol = config.tokens.findBySymbol(
          toChain,
          destToken.symbol,
        );

        if (withSameSymbol) {
          state.destToken = withSameSymbol.tuple;
        }
      }
    }
  }
};

export const transferInputSlice = createSlice({
  name: 'transfer',
  initialState: getInitialState(),
  reducers: {
    // validations
    setValidations: (
      state: TransferInputState,
      {
        payload: { showValidationState, validations },
      }: PayloadAction<{
        showValidationState: boolean;
        validations: TransferValidations;
      }>,
    ) => {
      Object.keys(validations).forEach((key) => {
        // @ts-ignore
        state.validations[key] = validations[key];
      });
      state.showValidationState = showValidationState;
    },
    // user input
    setToken: (
      state: TransferInputState,
      { payload }: PayloadAction<TokenTuple>,
    ) => {
      state.token = payload;
    },
    clearToken: (state: TransferInputState) => {
      state.token = undefined;
    },
    setDestToken: (
      state: TransferInputState,
      { payload }: PayloadAction<TokenTuple>,
    ) => {
      state.destToken = payload;
    },
    clearDestToken: (state: TransferInputState) => {
      state.destToken = undefined;
    },
    setFromChain: (
      state: TransferInputState,
      { payload }: PayloadAction<Chain>,
    ) => {
      state.fromChain = payload;
      performModificationsIfFromChainChanged(state);
    },
    setToChain: (
      state: TransferInputState,
      { payload }: PayloadAction<Chain>,
    ) => {
      state.toChain = payload;
      performModificationsIfToChainChanged(state);
    },
    setToNonSDKChain: (
      state: TransferInputState,
      { payload }: PayloadAction<NonSDKChain | undefined>,
    ) => {
      state.toNonSDKChain = payload;
    },
    setAmount: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      if (state.token && state.fromChain) {
        const token = config.tokens.get(state.token);
        if (token) {
          const { decimals } = token;
          const parsed = amount.parse(payload, decimals);
          if (amount.units(parsed) === 0n) {
            state.amount = undefined;
          } else {
            state.amount = parsed;
          }
        }
      } else {
        console.warn(`Can't call setAmount without a fromChain and token`);
      }
    },
    setReceiveAmount: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.receiveAmount = receiveDataWrapper(payload);
    },
    setFetchingReceiveAmount: (state: TransferInputState) => {
      state.receiveAmount = fetchDataWrapper();
    },
    setReceiveAmountError: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.receiveAmount = errorDataWrapper(payload);
    },
    updateBalances: (
      state: TransferInputState,
      {
        payload,
      }: PayloadAction<{
        address: WalletAddress;
        chain: Chain;
        balances: Balances;
      }>,
    ) => {
      const { chain, balances, address } = payload;
      if (!address) return;
      state.balances[address] ??= {};
      state.balances[address][chain] ??= {
        balances: {},
      };
      state.balances[address][chain]!.balances = {
        ...state.balances[address][chain]!.balances,
        ...balances,
      };
    },
    setTransferRoute: (
      state: TransferInputState,
      { payload }: PayloadAction<string | undefined>,
    ) => {
      if (!payload) {
        state.route = undefined;
        return;
      }
      state.route = payload;
    },
    // clear inputs
    clearTransfer: (state: TransferInputState) => {
      const initialState = getInitialState();
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
      { payload }: PayloadAction<TokenTuple[]>,
    ) => {
      state.supportedSourceTokens = payload;
    },
    swapInputs: (state: TransferInputState) => {
      const tmpChain = state.fromChain;
      state.fromChain = state.toChain;
      state.toChain = tmpChain;
      const tmpToken = state.token;
      state.token = state.destToken;
      state.destToken = tmpToken;
      performModificationsIfFromChainChanged(state);
      performModificationsIfToChainChanged(state);
    },
  },
});

export const isDisabledChain = (chain: Chain, wallet: WalletData) => {
  // Check if the wallet type (i.e. Metamask, Phantom...) is supported for the given chain
  if (wallet.name === 'OKX Wallet' && chain === 'Evmos') {
    return true;
  } else {
    return !walletAcceptedChains(wallet.type).includes(chain);
  }
};

export const selectFromChain = async (
  dispatch: any,
  chain: Chain,
  wallet: WalletData,
) => {
  selectChain(TransferWallet.SENDING, dispatch, chain, wallet);
};

export const selectToChain = async (
  dispatch: any,
  chain: Chain,
  wallet: WalletData,
) => {
  selectChain(TransferWallet.RECEIVING, dispatch, chain, wallet);
};

export const selectChain = async (
  type: TransferWallet,
  dispatch: any,
  chain: Chain,
  wallet: WalletData,
) => {
  if (isDisabledChain(chain, wallet)) {
    dispatch(clearWallet(type));
    const payload = {
      type,
      error: 'Wallet disconnected, please connect a supported wallet',
    };
    dispatch(setWalletError(payload));
  }

  // Call wallet switchChain if the new chain is of the same type
  // and a cosmos chain (while the wallet is the same the address will
  // vary depending on the chain)
  const chainConfig = config.chains[chain];
  if (!chainConfig) return;

  dispatch(
    type === TransferWallet.SENDING ? setFromChain(chain) : setToChain(chain),
  );
};

export const {
  setValidations,
  setToken,
  clearToken,
  setDestToken,
  clearDestToken,
  setFromChain,
  setToChain,
  setToNonSDKChain,
  setAmount,
  setTransferRoute,
  updateBalances,
  clearTransfer,
  setIsTransactionInProgress,
  setSupportedSourceTokens,
  swapInputs,
} = transferInputSlice.actions;

export default transferInputSlice.reducer;
