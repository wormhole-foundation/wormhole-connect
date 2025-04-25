import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chain } from '@wormhole-foundation/sdk';

type ExternalSearchState = {
  txHash?: string;
  chain?: Chain;
};

const initialState: ExternalSearchState = {
  txHash: undefined,
  chain: undefined,
};

const externalSearchSlice = createSlice({
  name: 'externalSearch',
  initialState,
  reducers: {
    setExternalSearch(
      state,
      action: PayloadAction<{
        txHash: string;
        chain: Chain;
      }>,
    ) {
      state.txHash = action.payload.txHash;
      state.chain = action.payload.chain;
    },
    clearExternalSearch(state) {
      state.txHash = undefined;
      state.chain = undefined;
    },
  },
});

export const { setExternalSearch, clearExternalSearch } =
  externalSearchSlice.actions;
export default externalSearchSlice.reducer;
