import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Route = 'bridge' | 'redeem';

export interface RouterState {
  route: Route;
  showFromNetworksModal: boolean;
  showToNetworksModal: boolean;
  showTokensModal: boolean;
  showWalletModal: boolean;
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
      { payload }: PayloadAction<boolean>,
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
