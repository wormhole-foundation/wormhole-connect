import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChainName } from 'sdk';

export interface TransferState {
  fromNetwork: ChainName | undefined;
  toNetwork: ChainName | undefined;
  token: string;
}

const initialState: TransferState = {
  fromNetwork: undefined,
  toNetwork: undefined,
  token: '',
};

export const transferSlice = createSlice({
  name: 'transfer',
  initialState,
  reducers: {
    setToken: (state: TransferState, payload: PayloadAction<string>) => {
      console.log('set token:', payload.payload);
      state.token = payload.payload;
    },
    setFromNetwork: (
      state: TransferState,
      payload: PayloadAction<ChainName>,
    ) => {
      console.log('set from network:', payload.payload);
      state.fromNetwork = payload.payload;
    },
    setToNetwork: (state: TransferState, payload: PayloadAction<ChainName>) => {
      console.log('set to network:', payload.payload);
      state.toNetwork = payload.payload;
    },
  },
});

export const { setToken, setFromNetwork, setToNetwork } = transferSlice.actions;

export default transferSlice.reducer;
