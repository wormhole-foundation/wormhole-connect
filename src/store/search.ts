import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Chain } from '@wormhole-foundation/sdk';

type SearchState = {
  txHash?: string;
  chain?: Chain;
};

const initialState: SearchState = {
  txHash: undefined,
  chain: undefined,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearch(
      state,
      action: PayloadAction<{
        txHash: string;
        chain: Chain;
      }>,
    ) {
      state.txHash = action.payload.txHash;
      state.chain = action.payload.chain;
    },
    clearSearch(state) {
      state.txHash = undefined;
      state.chain = undefined;
    },
  },
});

export const { setSearch, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
