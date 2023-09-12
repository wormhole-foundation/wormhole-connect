import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransferWallet } from 'utils/wallet';

export type Route = 'bridge' | 'redeem' | 'search' | 'terms' | 'faq';

export interface RouterState {
  route: Route;
  showFromChainsModal: boolean;
  showToChainsModal: boolean;
  showTokensModal: boolean;
  showWalletModal: TransferWallet | false;
}

const initialState: RouterState = {
  route: 'bridge',
  showFromChainsModal: false,
  showToChainsModal: false,
  showTokensModal: false,
  showWalletModal: false,
};

export const routerSlice = createSlice({
  name: 'router',
  initialState,
  reducers: {
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

export const { setWalletModal, setRoute } = routerSlice.actions;

export default routerSlice.reducer;
