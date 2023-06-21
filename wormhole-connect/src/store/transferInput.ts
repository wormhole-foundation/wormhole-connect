import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import { TokenConfig } from 'config/types';
import { toDecimals } from '../utils/balance';
import { TransferValidations } from '../utils/transferValidation';
import { TOKENS, config } from 'config';
import { getTokenDecimals } from '../utils';
import { TransferWallet, walletAcceptedNetworks } from 'utils/wallet';
import { PayloadType, toChainId } from 'utils/sdk';
import { clearWallet, setWalletError, WalletData } from './wallet';

export enum Route {
  BRIDGE = PayloadType.MANUAL, // 1
  RELAY = PayloadType.AUTOMATIC, // 3
  HASHFLOW = 10,
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

export interface TransferInputState {
  validate: boolean;
  validations: TransferValidations;
  fromNetwork: ChainName | undefined;
  toNetwork: ChainName | undefined;
  token: string;
  destToken: string;
  amount: number | undefined;
  route: Route;
  automaticRelayAvail: boolean;
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
  amount: undefined,
  route: Route.BRIDGE,
  automaticRelayAvail: false,
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
      state: TransferInputState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      state.toNetwork = payload;
    },
    setAmount: (
      state: TransferInputState,
      { payload }: PayloadAction<number | undefined>,
    ) => {
      state.amount = payload;
    },
    setBalance: (
      state: TransferInputState,
      { payload }: PayloadAction<Balances>,
    ) => {
      state.balances = { ...state.balances, ...payload };
    },
    setReceiverNativeBalance: (
      state: TransferInputState,
      { payload }: PayloadAction<string>,
    ) => {
      state.receiverNativeBalance = payload;
    },
    clearBalances: (state: TransferInputState) => {
      state.balances = {};
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
    enableAutomaticTransfer: (state: TransferInputState) => {
      state.automaticRelayAvail = true;
      state.route = Route.RELAY;
    },
    disableAutomaticTransfer: (state: TransferInputState) => {
      state.automaticRelayAvail = false;
      state.route = Route.BRIDGE;
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
  setBalance,
  clearBalances,
  setForeignAsset,
  setAssociatedTokenAddress,
  enableAutomaticTransfer,
  disableAutomaticTransfer,
  setTransferRoute,
  setManualGasEst,
  setAutomaticGasEst,
  setClaimGasEst,
  clearTransfer,
  setIsTransactionInProgress,
  setReceiverNativeBalance,
} = transferInputSlice.actions;

export default transferInputSlice.reducer;
