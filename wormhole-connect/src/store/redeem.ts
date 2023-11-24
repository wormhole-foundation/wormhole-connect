import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParsedMessage, ParsedRelayerMessage } from 'utils/sdk';
import { SignedMessage, TransferDestInfo } from 'routes';
import { Route } from 'config/types';

export enum MessageType {
  BRIDGE = 1,
  RELAY = 3,
}

export interface RedeemState {
  txData: ParsedMessage | ParsedRelayerMessage | undefined;
  signedMessage: SignedMessage | undefined;
  sendTx: string;
  redeemTx: string;
  transferComplete: boolean;
  isVaaEnqueued: boolean;
  route: Route | undefined;
  transferDestInfo: TransferDestInfo | undefined;
}

const initialState: RedeemState = {
  txData: undefined,
  signedMessage: undefined,
  sendTx: '',
  redeemTx: '',
  transferComplete: false,
  isVaaEnqueued: false,
  route: undefined,
  transferDestInfo: undefined,
};

export const redeemSlice = createSlice({
  name: 'redeem',
  initialState,
  reducers: {
    setTxDetails: (
      state: RedeemState,
      { payload }: PayloadAction<ParsedMessage | ParsedRelayerMessage>,
    ) => {
      state.txData = payload;
    },
    setSendTx: (state: RedeemState, { payload }: PayloadAction<string>) => {
      state.sendTx = payload;
    },
    setRedeemTx: (state: RedeemState, { payload }) => {
      state.redeemTx = payload;
    },
    setRoute: (state: RedeemState, { payload }) => {
      state.route = payload;
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
    setTransferDestInfo: (
      state: RedeemState,
      { payload }: PayloadAction<TransferDestInfo | undefined>,
    ) => {
      state.transferDestInfo = payload;
    },
    clearRedeem: (state: RedeemState) => {
      Object.keys(state).forEach((key) => {
        // @ts-ignore
        state[key] = initialState[key];
      });
    },
    setSignedMessage: (
      state: RedeemState,
      { payload }: PayloadAction<SignedMessage>,
    ) => {
      state.signedMessage = payload;
    },
  },
});

export const {
  setTxDetails,
  setSendTx,
  setRedeemTx,
  setTransferComplete,
  setIsVaaEnqueued,
  setTransferDestInfo,
  clearRedeem,
  setRoute,
  setSignedMessage,
} = redeemSlice.actions;

export default redeemSlice.reducer;
