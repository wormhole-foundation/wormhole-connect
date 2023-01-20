import { createSlice } from '@reduxjs/toolkit';

export enum WalletType {
  NONE = 0,
  METAMASK,
  TRUST_WALLET,
}

export interface WalletState {
  sending: {
    connected: boolean;
    type: WalletType;
    address: string;
  };
  receiving: {
    connected: boolean;
    type: WalletType;
    address: string;
  };
}

const initialState: WalletState = {
  sending: {
    connected: false,
    type: WalletType.NONE,
    address: '',
  },
  receiving: {
    connected: false,
    type: WalletType.NONE,
    address: '',
  },
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (state: WalletState) => {
      console.log('connect sending wallet');
      // TODO: open wallet modal
      state.sending.connected = true;
      state.sending.address = '0x1234...5678';
    },
    connectReceivingWallet: (state: WalletState) => {
      console.log('connect receiving wallet');
      state.receiving.connected = true;
      state.receiving.address = '0x8765...4321';
    },
  },
});

export const { connectWallet, connectReceivingWallet } = walletSlice.actions;

export default walletSlice.reducer;
