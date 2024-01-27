import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DataWrapper,
  getEmptyDataWrapper,
  receiveDataWrapper,
} from './helpers';
import { InboundQueuedTransfer } from 'routes/ntt/types';

export interface NTTState {
  deliveryPrice: string;
  inboundQueuedTransfer: DataWrapper<InboundQueuedTransfer | undefined>;
}

const initialState: NTTState = {
  inboundQueuedTransfer: getEmptyDataWrapper(),
  deliveryPrice: '',
};

export const nttSlice = createSlice({
  name: 'ntt',
  initialState,
  reducers: {
    setInboundQueuedTransfer: (
      state: NTTState,
      { payload }: PayloadAction<InboundQueuedTransfer | undefined>,
    ) => {
      state.inboundQueuedTransfer = receiveDataWrapper(payload);
    },
    resetInboundQueuedTransfer: (state: NTTState) => {
      state.inboundQueuedTransfer = getEmptyDataWrapper();
    },
    clearNTT: () => initialState,
  },
});

export const {
  setInboundQueuedTransfer,
  resetInboundQueuedTransfer,
  clearNTT,
} = nttSlice.actions;

export default nttSlice.reducer;
