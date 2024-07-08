import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParsedMessage } from 'utils/sdk';
import { TransferDestInfo } from 'routes';
import { Route } from 'config/types';
import { DeliveryStatus } from 'utils/sdk';

export enum MessageType {
  BRIDGE = 1,
  RELAY = 3,
}

export interface RedeemState {
  txData?: ParsedMessage;
  sendTx: string;
  redeemTx: string;
  transferComplete: boolean;
  isVaaEnqueued: boolean;
  isInvalidVaa: boolean;
  route: Route | undefined;
  transferDestInfo: TransferDestInfo | undefined;
  deliveryStatus: DeliveryStatus | undefined;
  isResumeTx: boolean;
}

const initialState: RedeemState = {
  txData: undefined,
  sendTx: '',
  redeemTx: '',
  transferComplete: false,
  isVaaEnqueued: false,
  isInvalidVaa: false,
  route: undefined,
  transferDestInfo: undefined,
  deliveryStatus: undefined,
  isResumeTx: false,
};

export const redeemSlice = createSlice({
  name: 'redeem',
  initialState,
  reducers: {
    setTxDetails: (
      state: RedeemState,
      { payload }: PayloadAction<ParsedMessage>,
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
    setDeliveryStatus: (
      state: RedeemState,
      { payload }: PayloadAction<DeliveryStatus>,
    ) => {
      state.deliveryStatus = payload;
    },
    setInvalidVaa: (
      state: RedeemState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.isInvalidVaa = payload;
    },
    setIsResumeTx: (
      state: RedeemState,
      { payload }: PayloadAction<boolean>,
    ) => {
      state.isResumeTx = payload;
    },
  },
});

export const {
  setTxDetails,
  setSendTx,
  setRedeemTx,
  setTransferComplete,
  setIsVaaEnqueued,
  setInvalidVaa,
  setTransferDestInfo,
  clearRedeem,
  setRoute,
  setDeliveryStatus,
  setIsResumeTx,
} = redeemSlice.actions;

export default redeemSlice.reducer;
