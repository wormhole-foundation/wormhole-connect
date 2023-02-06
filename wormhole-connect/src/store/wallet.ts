import { createSlice } from '@reduxjs/toolkit';
import { Wallet } from '../utils/wallet';

export enum WalletType {
  NONE = 0,
  METAMASK,
  TRUST_WALLET,
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
      console.log('connect sending wallet');
      state.sending.address = payload;
      state.sending.currentAddress = payload;
    },
    connectReceivingWallet: (
      state: WalletState,
      { payload }: { payload: string },
    ) => {
      console.log('connect receiving wallet');
      state.receiving.address = payload;
      state.receiving.currentAddress = payload;
    },
    clearWallet: (state: WalletState, { payload }: { payload: Wallet }) => {
      const reset = {
        address: '',
        type: WalletType.NONE,
        currentAddress: '',
      };
      state[payload] = reset;
    },
    setCurrentAddress: (
      state: WalletState,
      { payload }: { payload: { type: Wallet; address: string } },
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
