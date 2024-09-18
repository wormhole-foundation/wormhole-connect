import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Context } from 'sdklegacy';
import config from 'config';
import { TokenConfig } from 'config/types';
import { getTokenDecimals } from 'utils';
import {
  switchChain,
  TransferWallet,
  walletAcceptedChains,
} from 'utils/wallet';
import { clearWallet, setAddress, setWalletError, WalletData } from './wallet';
import {
  DataWrapper,
  errorDataWrapper,
  fetchDataWrapper,
  getEmptyDataWrapper,
  receiveDataWrapper,
} from './helpers';
import { amount, Chain } from '@wormhole-foundation/sdk';

export type Balance = {
  lastUpdated: number;
  balance: string | null;
};
export type Balances = { [key: string]: Balance };
export type ChainBalances = {
  balances: Balances;
};
export type BalancesCache = { [key in Chain]?: ChainBalances };
type WalletAddress = string;
export type WalletBalances = { [key: WalletAddress]: BalancesCache };

export const formatBalance = (
  chain: Chain,
  token: TokenConfig,
  balance: string | bigint | null,
): string | null => {
  if (!balance) {
    return null;
  }
  const decimals = getTokenDecimals(chain, token.tokenId);
  const balanceNum = amount.whole({
    amount: balance.toString(),
    decimals,
  });
  return balanceNum.toLocaleString('en', {
    maximumFractionDigits: 6,
  });
};

export const formatStringAmount = (amountStr = '0'): string => {
  const amountNum = parseFloat(amountStr);
  return amountNum.toLocaleString('en', {
    maximumFractionDigits: 4,
  });
};

// for use in USDC or other tokens that have versions on many chains
// returns token key
export const getNativeVersionOfToken = (
  tokenSymbol: string,
  chain: Chain,
): string => {
  return (
    Object.entries(config.tokens)
      .map(([key, t]) => t)
      .find((t) => t.symbol === tokenSymbol && t.nativeChain === chain)?.key ||
    ''
  );
};

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
  token: string,
): Balance | undefined => {
  const chainBalances = accessChainBalances(balances, walletAddress, chain);
  if (!chainBalances) return undefined;
  return chainBalances.balances[token];
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
  toNativeToken: ValidationErr;
  relayerFee: ValidationErr;
  receiveAmount: ValidationErr;
};

export type RouteState = {
  name: string;
  supported: boolean;
};

export interface TransferInputState {
  showValidationState: boolean;
  validations: TransferValidations;
  routeStates: RouteState[] | undefined;
  fromChain: Chain | undefined;
  toChain: Chain | undefined;
  token: string;
  destToken: string;
  amount: string;
  receiveAmount: DataWrapper<string>;
  route?: string;
  balances: WalletBalances;
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

// This is a function because config might have changed since we last cleared this store
function getInitialState(): TransferInputState {
  return {
    showValidationState: false,
    validations: {
      fromChain: '',
      toChain: '',
      token: '',
      destToken: '',
      amount: '',
      toNativeToken: '',
      sendingWallet: '',
      receivingWallet: '',
      relayerFee: '',
      receiveAmount: '',
    },
    routeStates: undefined,
    fromChain: config.ui.defaultInputs?.fromChain || undefined,
    toChain: config.ui.defaultInputs?.toChain || undefined,
    token: config.ui.defaultInputs?.tokenKey || '',
    destToken: '',
    amount: '',
    receiveAmount: getEmptyDataWrapper(),
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
    supportedDestTokens: [],
  };
}

const performModificationsIfFromChainChanged = (state: TransferInputState) => {
  const { fromChain, token } = state;
  if (token) {
    const tokenConfig = config.tokens[token];
    // clear token and amount if not supported on the selected network
    if (
      !fromChain ||
      (!tokenConfig.tokenId && tokenConfig.nativeChain !== fromChain)
    ) {
      state.token = '';
      state.amount = '';
    }
    if (
      tokenConfig.symbol === 'USDC' &&
      tokenConfig.nativeChain !== fromChain
    ) {
      state.token = getNativeVersionOfToken('USDC', fromChain!);
    } else if (
      tokenConfig.symbol === 'tBTC' &&
      tokenConfig.nativeChain !== fromChain
    ) {
      state.token =
        getNativeVersionOfToken('tBTC', fromChain!) ||
        config.tokens['tBTC']?.key ||
        '';
    }
  }
};

const performModificationsIfToChainChanged = (state: TransferInputState) => {
  const { toChain, destToken } = state;

  if (destToken) {
    const tokenConfig = config.tokens[destToken];
    if (!toChain) {
      state.destToken = '';
    }
    if (tokenConfig.symbol === 'USDC' && tokenConfig.nativeChain !== toChain) {
      state.destToken = getNativeVersionOfToken('USDC', toChain!);
    } else if (
      tokenConfig.symbol === 'tBTC' &&
      tokenConfig.nativeChain !== toChain
    ) {
      state.destToken =
        getNativeVersionOfToken('tBTC', toChain!) ||
        config.tokens['tBTC']?.key ||
        '';
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
    setRoute: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.route = payload;
    },
    setRoutes: (
      state: TransferInputState,
      { payload }: PayloadAction<RouteState[]>,
    ) => {
      state.routeStates = payload;
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
    setReceiverNativeBalance: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.receiverNativeBalance = payload;
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
      { payload }: PayloadAction<string | undefined>,
    ) => {
      if (!payload) {
        state.route = undefined;
        return;
      }
      if (
        state.routeStates &&
        state.routeStates.some((rs) => rs.name === payload && rs.supported)
      ) {
        state.route = payload;
      } else {
        state.route = undefined;
      }
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
  if (chainConfig.context === wallet.type && wallet.type === Context.COSMOS) {
    const address = await switchChain(chainConfig.chainId, type);
    if (address) {
      dispatch(setAddress({ type, address }));
    }
  }

  dispatch(
    type === TransferWallet.SENDING ? setFromChain(chain) : setToChain(chain),
  );
};

export const {
  setValidations,
  setRoute,
  setRoutes,
  setToken,
  setDestToken,
  setFromChain,
  setToChain,
  setAmount,
  setReceiveAmount,
  setFetchingReceiveAmount,
  setReceiveAmountError,
  setForeignAsset,
  setAssociatedTokenAddress,
  setTransferRoute,
  updateBalances,
  clearTransfer,
  setIsTransactionInProgress,
  setReceiverNativeBalance,
  setSupportedDestTokens,
  setSupportedSourceTokens,
  swapInputs,
} = transferInputSlice.actions;

export default transferInputSlice.reducer;
