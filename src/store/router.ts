import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Route = 'bridge' | 'redeem';

export interface RouterState {
  showFromNetworksModal: boolean;
  showToNetworksModal: boolean;
  showTokensModal: boolean;
  showWalletModal: boolean;
  route: Route;
}

const initialState: RouterState = {
  showFromNetworksModal: false,
  showToNetworksModal: false,
  showTokensModal: false,
  showWalletModal: false,
  route: 'bridge',
};

export const routerSlice = createSlice({
  name: 'router',
  initialState,
  reducers: {
    setFromNetworksModal: (
      state: RouterState,
      { payload }: PayloadAction<boolean>,
    ) => {
      console.log('show from networks modal:', payload);
      state.showFromNetworksModal = payload;
    },
    setToNetworksModal: (
      state: RouterState,
      { payload }: PayloadAction<boolean>,
    ) => {
      console.log('show from networks modal:', payload);
      state.showToNetworksModal = payload;
    },
    setTokensModal: (
      state: RouterState,
      { payload }: PayloadAction<boolean>,
    ) => {
      console.log('show tokens modal:', payload);
      state.showTokensModal = payload;
    },
    setWalletModal: (
      state: RouterState,
      { payload }: PayloadAction<boolean>,
    ) => {
      console.log('show tokens modal:', payload);
      state.showWalletModal = payload;
    },
    setRoute: (state: RouterState, { payload }: PayloadAction<Route>) => {
      console.log('show route:', payload);
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
