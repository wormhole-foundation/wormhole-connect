import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RFQ = {
  gasEstimate: number;
  nativeTokenPriceUsd: number;
  quoteData: {
    baseToken: string;
    baseTokenAmount: string;
    nonce: number;
    pool: string;
    quoteExpiry: number;
    quoteToken: string;
    quoteTokenAmount: string;
    rfqType: number;
    trader: string;
    txId: string;
  };
  rfqId: string;
  rfqType: number;
  signature: string;
  status: string;
};

export interface HashflowState {
  rfq: RFQ | undefined;
}

const initialState: HashflowState = {
  rfq: undefined,
};

export const hashflowSlice = createSlice({
  name: 'hashflow',
  initialState,
  reducers: {
    // validations
    setRfq: (state: HashflowState, { payload }: PayloadAction<RFQ>) => {
      state.rfq = payload;
    },
  },
});

export const { setRfq } = hashflowSlice.actions;

export default hashflowSlice.reducer;
