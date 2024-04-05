import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  DataWrapper,
  getEmptyDataWrapper,
  receiveDataWrapper,
} from './helpers';
import { InboundQueuedTransfer } from 'routes/ntt/types';

export interface NttState {
  inboundQueuedTransfer: DataWrapper<InboundQueuedTransfer | undefined>;
}

const initialState: NttState = {
  inboundQueuedTransfer: getEmptyDataWrapper(),
};

export const nttSlice = createSlice({
  name: 'ntt',
  initialState,
  reducers: {
    setInboundQueuedTransfer: (
      state: NttState,
      { payload }: PayloadAction<InboundQueuedTransfer | undefined>,
    ) => {
      state.inboundQueuedTransfer = receiveDataWrapper(payload);
    },
    resetInboundQueuedTransfer: (state: NttState) => {
      state.inboundQueuedTransfer = getEmptyDataWrapper();
    },
    clearNtt: () => initialState,
  },
});

export const {
  setInboundQueuedTransfer,
  resetInboundQueuedTransfer,
  clearNtt,
} = nttSlice.actions;

export default nttSlice.reducer;
