import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RouterState {
  showFromNetworksModal: boolean;
  showToNetworksModal: boolean;
  showTokensModal: boolean;
}

const initialState: RouterState = {
  showFromNetworksModal: false,
  showToNetworksModal: false,
  showTokensModal: false,
};

export const routerSlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    setFromNetworksModal: (
      state: RouterState,
      payload: PayloadAction<boolean>,
    ) => {
      console.log('show from networks modal:', payload.payload);
      state.showFromNetworksModal = payload.payload;
    },
    setToNetworksModal: (
      state: RouterState,
      payload: PayloadAction<boolean>,
    ) => {
      console.log('show from networks modal:', payload.payload);
      state.showToNetworksModal = payload.payload;
    },
    setTokensModal: (state: RouterState, payload: PayloadAction<boolean>) => {
      console.log('show tokens modal:', payload.payload);
      state.showTokensModal = payload.payload;
    },
  },
});

export const { setFromNetworksModal, setToNetworksModal, setTokensModal } =
  routerSlice.actions;

export default routerSlice.reducer;
