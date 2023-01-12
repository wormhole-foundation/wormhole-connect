import {
  ChainId,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
} from "@certusone/wormhole-sdk";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Transaction } from "./transfer";

const LAST_STEP = 3;

type Steps = 0 | 1 | 2 | 3;

export interface AttestState {
  activeStep: Steps;
  sourceChain: ChainId;
  sourceAsset: string;
  targetChain: ChainId;
  attestTx: Transaction | undefined;
  signedVAAHex: string | undefined;
  isSending: boolean;
  isCreating: boolean;
  createTx: Transaction | undefined;
}

const initialState: AttestState = {
  activeStep: 0,
  sourceChain: CHAIN_ID_SOLANA,
  sourceAsset: "",
  targetChain: CHAIN_ID_ETH,
  attestTx: undefined,
  signedVAAHex: undefined,
  isSending: false,
  isCreating: false,
  createTx: undefined,
};

export const attestSlice = createSlice({
  name: "attest",
  initialState,
  reducers: {
    incrementStep: (state: AttestState) => {
      if (state.activeStep < LAST_STEP) state.activeStep++;
    },
    decrementStep: (state: AttestState) => {
      if (state.activeStep > 0) state.activeStep--;
    },
    setStep: (state: AttestState, action: PayloadAction<Steps>) => {
      state.activeStep = action.payload;
    },
    setSourceChain: (state: AttestState, action: PayloadAction<ChainId>) => {
      const prevSourceChain = state.sourceChain;
      state.sourceChain = action.payload;
      state.sourceAsset = "";
      if (state.targetChain === action.payload) {
        state.targetChain = prevSourceChain;
      }
    },
    setSourceAsset: (state: AttestState, action: PayloadAction<string>) => {
      state.sourceAsset = action.payload;
    },
    setTargetChain: (state: AttestState, action: PayloadAction<ChainId>) => {
      const prevTargetChain = state.targetChain;
      state.targetChain = action.payload;
      if (state.sourceChain === action.payload) {
        state.sourceChain = prevTargetChain;
        state.activeStep = 0;
        state.sourceAsset = "";
      }
    },
    setAttestTx: (state: AttestState, action: PayloadAction<Transaction>) => {
      state.attestTx = action.payload;
    },
    setSignedVAAHex: (state: AttestState, action: PayloadAction<string>) => {
      state.signedVAAHex = action.payload;
      state.isSending = false;
      state.activeStep = 3;
    },
    setIsSending: (state: AttestState, action: PayloadAction<boolean>) => {
      state.isSending = action.payload;
    },
    setIsCreating: (state: AttestState, action: PayloadAction<boolean>) => {
      state.isCreating = action.payload;
    },
    setCreateTx: (state: AttestState, action: PayloadAction<Transaction>) => {
      state.createTx = action.payload;
      state.isCreating = false;
    },
    reset: (state: AttestState) => ({
      ...initialState,
      sourceChain: state.sourceChain,
      targetChain: state.targetChain,
    }),
  },
});

export const {
  incrementStep,
  decrementStep,
  setStep,
  setSourceChain,
  setSourceAsset,
  setTargetChain,
  setAttestTx,
  setSignedVAAHex,
  setIsSending,
  setIsCreating,
  setCreateTx,
  reset,
} = attestSlice.actions;

export default attestSlice.reducer;