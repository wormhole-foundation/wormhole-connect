import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransferWallet } from '../utils/wallet';

export type Route = 'bridge' | 'redeem' | 'search';

export interface RouterState {
  route: Route;
  showFromNetworksModal: boolean;
  showToNetworksModal: boolean;
  showTokensModal: boolean;
  showWalletModal: TransferWallet | false;
}

const initialState: RouterState = {
  route: 'bridge',
  showFromNetworksModal: false,
  showToNetworksModal: false,
  showTokensModal: false,
  showWalletModal: false,
};

export const routerSlice = createSlice({
  name: 'router',
  initialState,
  reducers: {
    setFromNetworksModal: (
      state: RouterState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.showFromNetworksModal = payload;
    },
    setToNetworksModal: (
      state: RouterState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.showToNetworksModal = payload;
    },
    setTokensModal: (
      state: RouterState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.showTokensModal = payload;
    },
    setWalletModal: (
      state: RouterState,
      { payload }: PayloadAction<TransferWallet | false>,
    ) => {
      state.showWalletModal = payload;
    },
    setRoute: (state: RouterState, { payload }: PayloadAction<Route>) => {
      state.route = payload;
    },
  },
});

export const {
  setFromNetworksModal,
  setToNetworksModal,
  setTokensModal,
  setWalletModal,
  setRoute,
} = routerSlice.actions;

export default routerSlice.reducer;
