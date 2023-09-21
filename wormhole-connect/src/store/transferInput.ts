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
export type ChainBalances = {
  lastUpdated: number | undefined;
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
  return { [token.key]: formattedBalance };
};

// for use in USDC or other tokens that have versions on many chains
// returns token key
export const getNativeVersionOfToken = (
  tokenSymbol: string,
  chain: ChainName,
): string => {
  return (
    Object.entries(TOKENS)
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
): string | null => {
  const chainBalances = accessChainBalances(balances, walletAddress, chain);
  if (!chainBalances) return null;
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
};

export interface TransferInputState {
  validate: boolean;
  validations: TransferValidations;
  availableRoutes: string[] | undefined;
  fromChain: ChainName | undefined;
  toChain: ChainName | undefined;
  token: string;
  destToken: string;
  amount: string;
  receiveAmount: string;
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
  },
  availableRoutes: undefined,
  fromChain: config?.bridgeDefaults?.fromNetwork || undefined,
  toChain: config?.bridgeDefaults?.toNetwork || undefined,
  token: config?.bridgeDefaults?.token || '',
  destToken: '',
  amount: '',
  receiveAmount: '',
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
};

const performModificationsIfFromChainChanged = (state: TransferInputState) => {
  const { fromChain, token } = state;
  if (token) {
    const tokenConfig = TOKENS[token];
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
    }
  }
};

const performModificationsIfToChainChanged = (state: TransferInputState) => {
  const { toChain, destToken } = state;

  if (destToken) {
    const tokenConfig = TOKENS[destToken];
    if (!toChain) {
      state.destToken = '';
    }
    if (tokenConfig.symbol === 'USDC' && tokenConfig.nativeChain !== toChain) {
      state.destToken = getNativeVersionOfToken('USDC', toChain!);
    }
  }
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
      state.receiveAmount = payload;
    },
    setBalances: (
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
      const chainBalances = {
        [chain]: {
          lastUpdated: Date.now(),
          balances,
        },
      };
      const currentWalletBallances = state.balances[address] || {};
      state.balances[address] = Object.assign(
        currentWalletBallances,
        chainBalances,
      );
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
      if (state.availableRoutes && state.availableRoutes.includes(payload)) {
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
  setForeignAsset,
  setAssociatedTokenAddress,
  setTransferRoute,
  setSendingGasEst,
  setClaimGasEst,
  setBalances,
  clearTransfer,
  setIsTransactionInProgress,
  setReceiverNativeBalance,
  setSupportedDestTokens,
  setAllSupportedDestTokens,
  setSupportedSourceTokens,
  swapChains,
} = transferInputSlice.actions;

export default transferInputSlice.reducer;
