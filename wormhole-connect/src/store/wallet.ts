import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { disconnect, TransferWallet, WalletType } from '../utils/wallet';
import { Wallet } from '@xlabs-libs/wallet-aggregator-core';

export type WalletData = {
  type: WalletType;
  address: string;
  currentAddress: string;
  error: string;
  wallet?: Wallet;
};

export interface WalletState {
  sending: WalletData;
  receiving: WalletData;
}

const NO_WALLET: WalletData = {
  address: '',
  type: WalletType.NONE,
  currentAddress: '',
  error: '',
  wallet: undefined
};

const initialState: WalletState = {
  sending: NO_WALLET,
  receiving: NO_WALLET,
};

export type ConnectPayload = {
  address: string;
  type: WalletType;
  wallet: Wallet;
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (
      state: WalletState,
      { payload }: PayloadAction<ConnectPayload>,
    ) => {
      state.sending.type = payload.type;
      state.sending.address = payload.address;
      state.sending.currentAddress = payload.address;
      state.sending.wallet = payload.wallet;
      state.sending.error = '';
    },
    connectReceivingWallet: (
      state: WalletState,
      { payload }: PayloadAction<ConnectPayload>,
    ) => {
      state.receiving.type = payload.type;
      state.receiving.address = payload.address;
      state.receiving.currentAddress = payload.address;
      state.receiving.wallet = payload.wallet;
      state.receiving.error = '';
    },
    clearWallet: (
      state: WalletState,
      { payload }: PayloadAction<TransferWallet>,
    ) => {
      disconnect(payload);
      state[payload] = NO_WALLET;
    },
    setWalletError: (
      state: WalletState,
      { payload }: PayloadAction<{ type: TransferWallet; error: string }>,
    ) => {
      const { type, error } = payload;
      state[type].error = error;
    },
    setCurrentAddress: (
      state: WalletState,
      { payload }: PayloadAction<{ type: TransferWallet; address: string }>,
    ) => {
      const { type, address } = payload;
      state[type].currentAddress = address;
    },
    clearWallets: (state: WalletState) => {
      disconnect(TransferWallet.SENDING);
      disconnect(TransferWallet.RECEIVING);
      Object.keys(state).forEach((key) => {
        // @ts-ignore
        state[key] = initialState[key];
      });
    },
  },
});

export const {
  connectWallet,
  connectReceivingWallet,
  clearWallet,
  setCurrentAddress,
  setWalletError,
  clearWallets,
} = walletSlice.actions;

export default walletSlice.reducer;
