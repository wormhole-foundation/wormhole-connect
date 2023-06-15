import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParsedVaa } from 'utils/vaa';
import { ParsedMessage, ParsedRelayerMessage } from '../utils/sdk';

export enum MessageType {
  BRIDGE = 1,
  RELAY = 3,
}

export interface RedeemState {
  vaa: ParsedVaa | undefined;
  txData: ParsedMessage | ParsedRelayerMessage | undefined;
  sendTx: string;
  redeemTx: string;
  transferComplete: boolean;
  isVaaEnqueued: boolean;
}

const initialState: RedeemState = {
  vaa: undefined,
  txData: undefined,
  sendTx: '',
  redeemTx: '',
  transferComplete: false,
  isVaaEnqueued: false,
};

export const redeemSlice = createSlice({
  name: 'redeem',
  initialState,
  reducers: {
    setVaa: (state: RedeemState, { payload }: PayloadAction<ParsedVaa>) => {
      state.vaa = payload;
    },
    setTxDetails: (state: RedeemState, { payload }: PayloadAction<any>) => {
      state.txData = payload;
    },
    setSendTx: (state: RedeemState, { payload }: PayloadAction<string>) => {
      state.sendTx = payload;
    },
    setRedeemTx: (state: RedeemState, { payload }) => {
      state.redeemTx = payload;
    },
    setTransferComplete: (
      state: RedeemState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.transferComplete = payload;
    },
    setIsVaaEnqueued: (
      state: RedeemState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.isVaaEnqueued = payload;
    },
    clearRedeem: (state: RedeemState) => {
      Object.keys(state).forEach((key) => {
        // @ts-ignore
        state[key] = initialState[key];
      });
    },
  },
});

export const {
  setVaa,
  setTxDetails,
  setSendTx,
  setRedeemTx,
  setTransferComplete,
  setIsVaaEnqueued,
  clearRedeem,
} = redeemSlice.actions;

export default redeemSlice.reducer;
