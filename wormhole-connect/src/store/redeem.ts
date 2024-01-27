import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParsedMessage, ParsedRelayerMessage } from 'utils/sdk';
import { UnsignedNTTMessage, SignedMessage, TransferDestInfo } from 'routes';
import { Route } from 'config/types';

export enum MessageType {
  BRIDGE = 1,
  RELAY = 3,
}

export enum RelayStatus {
  Redeemed = 'redeemed',
  Failed = 'failed',
  Waiting = 'waiting',
  Active = 'inprogress',
}

export interface RedeemState {
  txData: ParsedMessage | ParsedRelayerMessage | UnsignedNTTMessage | undefined;
  signedMessage: SignedMessage | undefined;
  sendTx: string;
  redeemTx: string;
  transferComplete: boolean;
  isVaaEnqueued: boolean;
  route: Route | undefined;
  transferDestInfo: TransferDestInfo | undefined;
  relayStatus: RelayStatus | undefined;
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
  relayStatus: undefined,
};

export const redeemSlice = createSlice({
  name: 'redeem',
  initialState,
  reducers: {
    setTxDetails: (
      state: RedeemState,
      {
        payload,
      }: PayloadAction<
        ParsedMessage | ParsedRelayerMessage | UnsignedNTTMessage
      >,
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
    setRelayStatus: (
      state: RedeemState,
      { payload }: PayloadAction<RelayStatus>,
    ) => {
      state.relayStatus = payload;
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
  setRelayStatus,
} = redeemSlice.actions;

export default redeemSlice.reducer;
