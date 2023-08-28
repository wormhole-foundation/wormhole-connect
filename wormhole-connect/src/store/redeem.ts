import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParsedMessage, ParsedRelayerMessage } from '../utils/sdk';
import { Route } from './transferInput';
import { MessageInfo } from 'utils/routes';
import { ChainName } from '@wormhole-foundation/wormhole-connect-sdk';

export enum MessageType {
  BRIDGE = 1,
  RELAY = 3,
}

export interface RedeemState {
  messageInfo: MessageInfo | undefined;
  txData: ParsedMessage | ParsedRelayerMessage | undefined;
  sendTx: string;
  fromChain: ChainName;
  redeemTx: string;
  transferComplete: boolean;
  isVaaEnqueued: boolean;
  route: Route;
}

const initialState: RedeemState = {
  messageInfo: undefined,
  txData: undefined,
  sendTx: '',
  fromChain: 'ethereum',
  redeemTx: '',
  transferComplete: false,
  isVaaEnqueued: false,
  route: Route.BRIDGE,
};

export const redeemSlice = createSlice({
  name: 'redeem',
  initialState,
  reducers: {
    setMessageInfo: (
      state: RedeemState,
      { payload }: PayloadAction<MessageInfo>,
    ) => {
      state.messageInfo = payload;
    },
    setTxDetails: (state: RedeemState, { payload }: PayloadAction<any>) => {
      state.txData = payload;
    },
    setSendTx: (state: RedeemState, { payload }: PayloadAction<string>) => {
      state.sendTx = payload;
    },
    setFromChain: (
      state: RedeemState,
      { payload }: PayloadAction<ChainName>,
    ) => {
      state.fromChain = payload;
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
    clearRedeem: (state: RedeemState) => {
      Object.keys(state).forEach((key) => {
        // @ts-ignore
        state[key] = initialState[key];
      });
    },
  },
});

export const {
  setMessageInfo,
  setTxDetails,
  setSendTx,
  setFromChain,
  setRedeemTx,
  setTransferComplete,
  setIsVaaEnqueued,
  clearRedeem,
  setRoute,
} = redeemSlice.actions;

export default redeemSlice.reducer;
