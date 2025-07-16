import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Platform, Chain, chainToPlatform } from '@wormhole-foundation/sdk';
import {
  disconnect,
  TransferWallet,
  swapWalletConnections,
} from 'utils/wallet';
import { ReadOnlyWallet } from 'utils/wallet/ReadOnlyWallet';
import config from 'config';
import { TransactionRequest } from 'config/externalWallet';

export type WalletData = {
  type: Platform | undefined;
  address: string;
  currentAddress: string;
  error: string;
  icon?: string; // the wallet's icon encoded as a base64 string
  name: string;
};

export interface WalletState {
  sending: WalletData;
  receiving: WalletData;
}

const NO_WALLET: WalletData = {
  address: '',
  type: undefined,
  currentAddress: '',
  error: '',
  icon: undefined,
  name: '',
};

const initialState: WalletState = {
  sending: NO_WALLET,
  receiving: NO_WALLET,
};

// Async thunks for external wallet operations
export const connectExternalWallet = createAsyncThunk(
  'wallet/connectExternal',
  async ({ type, chain }: { type: TransferWallet; chain: Chain }) => {
    if (!config.externalWalletManager) {
      throw new Error('External wallet manager not configured');
    }

    const walletType =
      type === TransferWallet.SENDING ? 'sending' : 'receiving';
    const connected = await config.externalWalletManager.requestConnection(
      walletType,
      chain,
    );

    if (connected) {
      const walletState = await config.externalWalletManager.getWalletState(
        walletType,
      );
      return { type, walletState };
    }

    return { type, walletState: null };
  },
);

export const disconnectExternalWallet = createAsyncThunk(
  'wallet/disconnectExternal',
  async ({ type }: { type: TransferWallet }) => {
    if (!config.externalWalletManager) {
      throw new Error('External wallet manager not configured');
    }

    const walletType =
      type === TransferWallet.SENDING ? 'sending' : 'receiving';
    await config.externalWalletManager.requestDisconnection(walletType);

    return { type };
  },
);

export const swapExternalWallets = createAsyncThunk(
  'wallet/swapExternal',
  async () => {
    if (!config.externalWalletManager) {
      throw new Error('External wallet manager not configured');
    }

    // Handle external wallet swapping
    await swapWalletConnections();

    return {};
  },
);

export const signAndSendExternalTransaction = createAsyncThunk(
  'wallet/signAndSendExternal',
  async ({
    chain,
    transaction,
    walletType,
  }: {
    chain: Chain;
    transaction: any;
    walletType: TransferWallet;
  }) => {
    if (!config.externalWalletManager) {
      throw new Error('External wallet manager not configured');
    }

    const transactionRequest: TransactionRequest = {
      chain,
      transaction,
      walletType:
        walletType === TransferWallet.SENDING ? 'sending' : 'receiving',
    };

    return await config.externalWalletManager.signAndSendTransaction(
      transactionRequest,
    );
  },
);

export type ConnectPayload = {
  address: string;
  type: Platform;
  icon?: string;
  name: string;
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    connectWallet: (
      state: WalletState,
      { payload }: PayloadAction<ConnectPayload>,
    ) => {
      state.sending.address = payload.address;
      state.sending.currentAddress = payload.address;
      state.sending.type = payload.type;
      state.sending.name = payload.name;
      state.sending.error = '';
      state.sending.icon = payload.icon;
    },
    connectReceivingWallet: (
      state: WalletState,
      { payload }: PayloadAction<ConnectPayload>,
    ) => {
      state.receiving.address = payload.address;
      state.receiving.currentAddress = payload.address;
      state.receiving.type = payload.type;
      state.receiving.name = payload.name;
      state.receiving.error = '';
      state.receiving.icon = payload.icon;
    },
    clearWallet: (
      state: WalletState,
      { payload }: PayloadAction<TransferWallet>,
    ) => {
      state[payload] = NO_WALLET;
    },
    disconnectWallet: (
      state: WalletState,
      { payload }: PayloadAction<TransferWallet>,
    ) => {
      // Note: For external wallets, disconnection is handled via disconnectExternalWallet thunk
      // For internal wallets, we still call the utils function directly here
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
    setAddress: (
      state: WalletState,
      { payload }: PayloadAction<{ type: TransferWallet; address: string }>,
    ) => {
      const { type, address } = payload;
      state[type].address = address;
      state[type].currentAddress = address;
    },
    clearWallets: (state: WalletState) => {
      Object.keys(state).forEach((key) => {
        // @ts-ignore
        state[key] = initialState[key];
      });
    },
    swapWallets: (state: WalletState) => {
      const tmp = state.sending;
      state.sending = state.receiving;
      state.receiving = tmp;

      // Note: swapWalletConnections() is called outside this reducer
      // when external wallet manager is involved since it's now async

      // If the new sending wallet is a ReadOnlyWallet,
      // disconnect it since it can't be used for signing
      if (state.sending.name === ReadOnlyWallet.NAME) {
        disconnect(TransferWallet.SENDING);
        state[TransferWallet.SENDING] = NO_WALLET;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(connectExternalWallet.fulfilled, (state, action) => {
        const { type, walletState } = action.payload;
        if (walletState && walletState.isConnected && walletState.address) {
          const payload = {
            address: walletState.address,
            type: walletState.chain
              ? chainToPlatform(walletState.chain)
              : 'Evm',
            icon: walletState.walletIcon || '',
            name: walletState.walletName || 'External Wallet',
          };

          if (type === TransferWallet.SENDING) {
            state.sending = {
              ...payload,
              currentAddress: payload.address,
              error: '',
            };
          } else {
            state.receiving = {
              ...payload,
              currentAddress: payload.address,
              error: '',
            };
          }
        }
      })
      .addCase(connectExternalWallet.rejected, (state, action) => {
        console.error('External wallet connection failed:', action.error);
      })
      .addCase(disconnectExternalWallet.fulfilled, (state, action) => {
        const { type } = action.payload;
        state[type] = NO_WALLET;
      })
      .addCase(swapExternalWallets.fulfilled, (state) => {
        // Swap the wallet states
        const tmp = state.sending;
        state.sending = state.receiving;
        state.receiving = tmp;

        // If the new sending wallet is a ReadOnlyWallet,
        // disconnect it since it can't be used for signing
        if (state.sending.name === ReadOnlyWallet.NAME) {
          state[TransferWallet.SENDING] = NO_WALLET;
        }
      });
  },
});

export const {
  connectWallet,
  connectReceivingWallet,
  clearWallet,
  setAddress,
  setWalletError,
  clearWallets,
  disconnectWallet,
  swapWallets,
} = walletSlice.actions;

export default walletSlice.reducer;
