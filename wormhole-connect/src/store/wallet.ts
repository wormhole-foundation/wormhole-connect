import { createSlice } from '@reduxjs/toolkit';
import { disconnect, TransferWallet, WalletType } from '../utils/wallet';

export type WalletData = {
  type: WalletType;
  address: string;
  currentAddress: string;
};

export interface WalletState {
  sending: WalletData;
  receiving: WalletData;
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

export type ConnectPayload = {
  address: string;
  type: WalletType;
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (
      state: WalletState,
      { payload }: { payload: ConnectPayload },
    ) => {
      console.log('connect sending wallet', payload);
      state.sending.type = payload.type;
      state.sending.address = payload.address;
      state.sending.currentAddress = payload.address;
    },
    connectReceivingWallet: (
      state: WalletState,
      { payload }: { payload: ConnectPayload },
    ) => {
      console.log('connect receiving wallet', payload);
      state.receiving.type = payload.type;
      state.receiving.address = payload.address;
      state.receiving.currentAddress = payload.address;
    },
    clearWallet: (
      state: WalletState,
      { payload }: { payload: TransferWallet },
    ) => {
      const reset = {
        address: '',
        type: WalletType.NONE,
        currentAddress: '',
      };
      disconnect(payload);
      state[payload] = reset;
    },
    setCurrentAddress: (
      state: WalletState,
      { payload }: { payload: { type: TransferWallet; address: string } },
    ) => {
      state[payload.type].currentAddress = payload.address;
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
  clearWallets,
} = walletSlice.actions;

export default walletSlice.reducer;
