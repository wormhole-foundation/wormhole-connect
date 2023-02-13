import { createSlice } from '@reduxjs/toolkit';
import { TransferWallet } from '../utils/wallet';

export enum WalletType {
  NONE = 0,
  METAMASK,
  WALLET_CONNECT,
  PHANTOM,
  SOLFLARE,
}

export interface WalletState {
  sending: {
    type: WalletType;
    address: string;
    currentAddress: string;
  };
  receiving: {
    type: WalletType;
    address: string;
    currentAddress: string;
  };
}

const initialState: WalletState = {
  sending: {
    type: WalletType.NONE,
    address: '',
    currentAddress: '',
  },
  receiving: {
    type: WalletType.NONE,
    address: '',
    currentAddress: '',
  },
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (state: WalletState, { payload }: { payload: string }) => {
      console.log('connect sending wallet', payload);
      state.sending.address = payload;
      state.sending.currentAddress = payload;
    },
    connectReceivingWallet: (
      state: WalletState,
      { payload }: { payload: string },
    ) => {
      console.log('connect receiving wallet', payload);
      state.receiving.address = payload;
      state.receiving.currentAddress = payload;
    },
    clearWallet: (state: WalletState, { payload }: { payload: TransferWallet }) => {
      const reset = {
        address: '',
        type: WalletType.NONE,
        currentAddress: '',
      };
      state[payload] = reset;
    },
    setCurrentAddress: (
      state: WalletState,
      { payload }: { payload: { type: TransferWallet; address: string } },
    ) => {
      state[payload.type].currentAddress = payload.address;
    },
  },
});

export const {
  connectWallet,
  connectReceivingWallet,
  clearWallet,
  setCurrentAddress,
} = walletSlice.actions;

export default walletSlice.reducer;
