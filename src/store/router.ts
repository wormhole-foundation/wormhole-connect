import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransferWallet } from 'utils/wallet';

export type Route = 'bridge' | 'redeem' | 'history' | 'search' | 'terms';

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
    setRoute: (state: RouterState, { payload }: PayloadAction<Route>) => {
      state.route = payload;
    },
  },
});

export const { setRoute } = routerSlice.actions;

export default routerSlice.reducer;
