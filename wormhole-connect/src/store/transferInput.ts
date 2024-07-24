import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName, Context } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import config from 'config';
import { Route, TokenConfig } from 'config/types';
import { getTokenDecimals } from 'utils';
import { toDecimals } from 'utils/balance';
import { toChainId } from 'utils/sdk';
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
import { isPorticoRoute } from 'routes/porticoBridge/utils';
import { AvailableReason, isNttRoute } from 'routes';
import { getNttGroupKey, getNttTokenByGroupKey } from 'utils/ntt';

export type Balance = {
  lastUpdated: number;
  balance: string | null;
};
export type Balances = { [key: string]: Balance };
export type ChainBalances = {
  balances: Balances;
};
export type BalancesCache = { [key in ChainName]?: ChainBalances };
type WalletAddress = string;
export type WalletBalances = { [key: WalletAddress]: BalancesCache };

export const formatBalance = (
  chain: ChainName,
  token: TokenConfig,
  balance: BigNumber | null,
) => {
  const decimals = getTokenDecimals(toChainId(chain), token.tokenId);
  const formattedBalance =
    balance !== null ? toDecimals(balance, decimals, 6) : null;
  return formattedBalance;
};

// for use in USDC or other tokens that have versions on many chains
// returns token key
export const getNativeVersionOfToken = (
  tokenSymbol: string,
  chain: ChainName,
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
  chain: ChainName | undefined,
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
  chain: ChainName | undefined,
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
  route: ValidationErr;
  toNativeToken: ValidationErr;
  foreignAsset: ValidationErr;
  relayerFee: ValidationErr;
  receiveAmount: ValidationErr;
};

export type RouteState = {
  name: string;
  supported: boolean;
  validation: AvailableReason;
};

export interface TransferInputState {
  showValidationState: boolean;
  validations: TransferValidations;
  routeStates: RouteState[] | undefined;
  fromChain: ChainName | undefined;
  toChain: ChainName | undefined;
  token: string;
  destToken: string;
  amount: string;
  receiveAmount: DataWrapper<string>;
  route: Route | undefined;
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
  allSupportedDestTokens: TokenConfig[];
  supportedDestTokens: TokenConfig[];
  manualAddressTarget: boolean;
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
      route: '',
      toNativeToken: '',
      sendingWallet: '',
      receivingWallet: '',
      foreignAsset: '',
      relayerFee: '',
      receiveAmount: '',
    },
    routeStates: undefined,
    fromChain: config.bridgeDefaults?.fromNetwork || undefined,
    toChain: config.bridgeDefaults?.toNetwork || undefined,
    token: config.bridgeDefaults?.token || '',
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
    allSupportedDestTokens: [],
    supportedDestTokens: [],
    manualAddressTarget: false,
  };
}

const performModificationsIfFromChainChanged = (state: TransferInputState) => {
  const { fromChain, token, route, destToken } = state;
  if (token) {
    const tokenConfig = config.tokens[token];
    // clear token and amount if not supported on the selected network
    if (
      !fromChain ||
      (!tokenConfig.tokenId && tokenConfig.nativeChain !== fromChain)
    ) {
      state.token = '';
      if (!route || !isPorticoRoute(route)) {
        state.amount = '';
      }
    }
    if (isNttRoute(route) && destToken) {
      const groupKey = getNttGroupKey(tokenConfig, config.tokens[destToken]);
      if (groupKey && fromChain) {
        state.token = getNttTokenByGroupKey(groupKey, fromChain)?.key || '';
      } else {
        state.token = '';
      }
    } else if (
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
    } else if (route && isPorticoRoute(route)) {
      if (tokenConfig.nativeChain !== fromChain) {
        state.token = getNativeVersionOfToken(tokenConfig.symbol, fromChain!);
      }
    }
  }
};

const performModificationsIfToChainChanged = (state: TransferInputState) => {
  const { toChain, destToken, route, token } = state;

  if (destToken) {
    const tokenConfig = config.tokens[destToken];
    if (!toChain) {
      state.destToken = '';
    }
    if (isNttRoute(route) && token) {
      const groupKey = getNttGroupKey(tokenConfig, config.tokens[token]);
      if (groupKey && toChain) {
        state.destToken = getNttTokenByGroupKey(groupKey, toChain)?.key || '';
      } else {
        state.destToken = '';
      }
    } else if (
      tokenConfig.symbol === 'USDC' &&
      tokenConfig.nativeChain !== toChain
    ) {
      state.destToken = getNativeVersionOfToken('USDC', toChain!);
    } else if (
      tokenConfig.symbol === 'tBTC' &&
      tokenConfig.nativeChain !== toChain
    ) {
      state.destToken =
        getNativeVersionOfToken('tBTC', toChain!) ||
        config.tokens['tBTC']?.key ||
        '';
    } else if (route && isPorticoRoute(route)) {
      if (tokenConfig.nativeChain !== toChain) {
        state.destToken = getNativeVersionOfToken(tokenConfig.symbol, toChain!);
      }
    }
  }
};

// This function was relocated from a useEffect in the Bridge component to avoid
// the visual delay of two store updates.
// At the time, the dependency array included:
// [showValidationState, availableRoutes, fromChain, toChain, token, destToken, amount]
// However, the only dependency appears to be `availableRoutes`.
const establishRoute = (state: TransferInputState) => {
  const { routeStates } = state;
  if (!routeStates) {
    state.route = undefined;
    return;
  }
  const routeOrderOfPreference = [
    Route.CosmosGateway,
    Route.CCTPRelay,
    Route.CCTPManual,
    Route.TBTC,
    Route.ETHBridge,
    Route.wstETHBridge,
    Route.USDTBridge,
    Route.NttRelay,
    Route.NttManual,
    Route.Relay,
    Route.Bridge,
  ];
  for (const r of routeOrderOfPreference) {
    const routeState = routeStates.find((rs) => rs.name === r);
    if (
      routeState &&
      routeState.supported &&
      routeState.validation.isAvailable
    ) {
      state.route = r;
      return;
    }
  }
  state.route = undefined;
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
    setRoutes: (
      state: TransferInputState,
      { payload }: PayloadAction<RouteState[]>,
    ) => {
      state.routeStates = payload;
      establishRoute(state);
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
      performModificationsIfFromChainChanged(state);
    },
    setToChain: (
      state: TransferInputState,
      { payload }: PayloadAction<ChainName>,
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
        chain: ChainName;
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
      { payload }: PayloadAction<Route | undefined>,
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
    setAllSupportedDestTokens: (
      state: TransferInputState,
      { payload }: PayloadAction<TokenConfig[]>,
    ) => {
      state.allSupportedDestTokens = payload;
    },
    swapChains: (state: TransferInputState) => {
      const tmp = state.fromChain;
      state.fromChain = state.toChain;
      state.toChain = tmp;
      performModificationsIfFromChainChanged(state);
      performModificationsIfToChainChanged(state);
    },
    setManualAddressTarget: (
      state: TransferInputState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.manualAddressTarget = payload;
    },
  },
});

export const isDisabledChain = (chain: ChainName, wallet: WalletData) => {
  // Check if the wallet type (i.e. Metamask, Phantom...) is supported for the given chain
  if (wallet.name === 'OKX Wallet' && chain === 'evmos') {
    return true;
  } else {
    return !walletAcceptedChains(wallet.type).includes(chain);
  }
};

export const selectFromChain = async (
  dispatch: any,
  chain: ChainName,
  wallet: WalletData,
) => {
  selectChain(TransferWallet.SENDING, dispatch, chain, wallet);
};

export const selectToChain = async (
  dispatch: any,
  chain: ChainName,
  wallet: WalletData,
) => {
  selectChain(TransferWallet.RECEIVING, dispatch, chain, wallet);
};

export const selectChain = async (
  type: TransferWallet,
  dispatch: any,
  chain: ChainName,
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
  setSendingGasEst,
  setClaimGasEst,
  updateBalances,
  clearTransfer,
  setIsTransactionInProgress,
  setReceiverNativeBalance,
  setSupportedDestTokens,
  setAllSupportedDestTokens,
  setSupportedSourceTokens,
  swapChains,
  setManualAddressTarget,
} = transferInputSlice.actions;

export default transferInputSlice.reducer;
