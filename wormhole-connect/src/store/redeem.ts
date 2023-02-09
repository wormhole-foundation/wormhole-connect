import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ParsedVaa } from 'utils/vaa';
import {
  ParsedMessage,
  ParsedRelayerMessage,
} from '@wormhole-foundation/wormhole-connect-sdk';

export enum MessageType {
  BRIDGE = 1,
  RELAY = 3,
}

export interface RedeemState {
  vaa: ParsedVaa | undefined;
  txData: ParsedMessage | ParsedRelayerMessage | undefined;
  sendTx: string;
  redeemTx: string;
}

const initialState: RedeemState = {
  vaa: undefined,
  txData: undefined,
  sendTx: '',
  redeemTx: '',
};

export const redeemSlice = createSlice({
  name: 'redeem',
  initialState,
  reducers: {
    setVaa: (state: RedeemState, { payload }: PayloadAction<ParsedVaa>) => {
      console.log('set VAA:', payload);
      state.vaa = payload;
    },
    setTxDetails: (state: RedeemState, { payload }: PayloadAction<any>) => {
      console.log('set Tx details', payload);
      state.txData = payload;
    },
    setSendTx: (state: RedeemState, { payload }: PayloadAction<string>) => {
      console.log('set tx hash:', payload);
      state.sendTx = payload;
    },
    setRedeemTx: (state: RedeemState, { payload }) => {
      console.log('set redeem tx:', payload);
      state.redeemTx = payload;
    },
  },
});

export const { setVaa, setTxDetails, setSendTx, setRedeemTx } = redeemSlice.actions;

export default redeemSlice.reducer;
