import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParsedVaa } from 'utils/vaa';

export interface RedeemState {
  vaa: ParsedVaa | undefined;
}

const initialState: RedeemState = {
  vaa: undefined,
};

export const redeemSlice = createSlice({
  name: 'redeem',
  initialState,
  reducers: {
    setVaa: (state: RedeemState, { payload }: PayloadAction<ParsedVaa>) => {
      console.log('set VAA:', payload);
      state.vaa = payload;
    },
  },
});

export const { setVaa } = redeemSlice.actions;

export default redeemSlice.reducer;
