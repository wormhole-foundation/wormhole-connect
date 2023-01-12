import {
  ChainId,
  CHAIN_ID_ETH,
  CHAIN_ID_SOLANA,
} from "@certusone/wormhole-sdk";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const LAST_STEP = 3;

type Steps = 0 | 1 | 2 | 3;

export interface ParsedTokenAccount {
  publicKey: string;
  mintKey: string;
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
  symbol?: string;
  name?: string;
  logo?: string;
  isNativeAsset?: boolean;
}

export interface Transaction {
  id: string;
  block: number;
}

export interface TransferState {
  activeStep: Steps;
  sourceChain: ChainId;
  isSourceAssetWormholeWrapped: boolean | undefined;
  originChain: ChainId | undefined;
  originAsset: string | undefined;
  sourceWalletAddress: string | undefined;
  sourceParsedTokenAccount: ParsedTokenAccount | undefined;
  sourceParsedTokenAccounts: ParsedTokenAccount[] | undefined;
  amount: string;
  targetChain: ChainId;
  targetAddressHex: string | undefined;
  // targetAsset: ForeignAssetInfo | undefined;
  targetParsedTokenAccount: ParsedTokenAccount | undefined;
  transferTx: Transaction | undefined;
  signedVAAHex: string | undefined;
  isSending: boolean;
  isVAAPending: boolean;
  isRedeeming: boolean;
  redeemTx: Transaction | undefined;
  isApproving: boolean;
  isRecovery: boolean;
  gasPrice: number | undefined;
  useRelayer: boolean;
  relayerFee: string | undefined;
  // acalaRelayerInfo: AcalaRelayerInfo | undefined;
}

const initialState: TransferState = {
  activeStep: 0,
  sourceChain: CHAIN_ID_SOLANA,
  isSourceAssetWormholeWrapped: false,
  sourceWalletAddress: undefined,
  sourceParsedTokenAccount: undefined,
  sourceParsedTokenAccounts: undefined,
  originChain: undefined,
  originAsset: undefined,
  amount: "",
  targetChain: CHAIN_ID_ETH,
  targetAddressHex: undefined,
  // targetAsset: undefined,
  targetParsedTokenAccount: undefined,
  transferTx: undefined,
  signedVAAHex: undefined,
  isSending: false,
  isVAAPending: false,
  isRedeeming: false,
  redeemTx: undefined,
  isApproving: false,
  isRecovery: false,
  gasPrice: undefined,
  useRelayer: false,
  relayerFee: undefined,
  // acalaRelayerInfo: undefined,
};

export const transferSlice = createSlice({
  name: "transfer",
  initialState,
  reducers: {
    incrementStep: (state: TransferState) => {
      if (state.activeStep < LAST_STEP) state.activeStep++;
    },
    decrementStep: (state: TransferState) => {
      if (state.activeStep > 0) state.activeStep--;
    },
    setStep: (state: TransferState, action: PayloadAction<Steps>) => {
      state.activeStep = action.payload;
    },
    // setSourceChain: (state: TransferState, action: PayloadAction<ChainId>) => {
    //   const prevSourceChain = state.sourceChain;
    //   state.sourceChain = action.payload;
    //   state.sourceParsedTokenAccount = undefined;
    //   state.sourceParsedTokenAccounts = undefined;
    //   // clear targetAsset so that components that fire before useFetchTargetAsset don't get stale data
    //   // state.targetAsset = undefined;
    //   state.targetParsedTokenAccount = undefined;
    //   state.targetAddressHex = undefined;
    //   state.isSourceAssetWormholeWrapped = undefined;
    //   state.originChain = undefined;
    //   state.originAsset = undefined;
    //   if (state.targetChain === action.payload) {
    //     state.targetChain = prevSourceChain;
    //   }
    // },
    // setSourceWormholeWrappedInfo: (
    //   state: TransferState,
    //   action: PayloadAction<any>
    // ) => {
    //   state.isSourceAssetWormholeWrapped = action.payload.isWrapped;
    //   state.originChain = action.payload.chainId;
    //   state.originAsset = action.payload.assetAddress;
    // },
    // setSourceWalletAddress: (
    //   state: TransferState,
    //   action: PayloadAction<string | undefined>
    // ) => {
    //   state.sourceWalletAddress = action.payload;
    // },
    // setSourceParsedTokenAccount: (
    //   state: TransferState,
    //   action: PayloadAction<ParsedTokenAccount | undefined>
    // ) => {
    //   state.sourceParsedTokenAccount = action.payload;
    //   // clear targetAsset so that components that fire before useFetchTargetAsset don't get stale data
    //   // state.targetAsset = undefined;
    //   state.targetParsedTokenAccount = undefined;
    //   state.targetAddressHex = undefined;
    //   state.isSourceAssetWormholeWrapped = undefined;
    //   state.originChain = undefined;
    //   state.originAsset = undefined;
    // },
    // setSourceParsedTokenAccounts: (
    //   state: TransferState,
    //   action: PayloadAction<ParsedTokenAccount[] | undefined>
    // ) => {
    //   state.sourceParsedTokenAccounts = action.payload
    //     ? receiveDataWrapper(action.payload)
    //     : undefined;
    // },
    // fetchSourceParsedTokenAccounts: (state: TransferState) => {
    //   state.sourceParsedTokenAccounts = fetchDataWrapper();
    // },
    // errorSourceParsedTokenAccounts: (
    //   state: TransferState,
    //   action: PayloadAction<string | undefined>
    // ) => {
    //   state.sourceParsedTokenAccounts = errorDataWrapper(
    //     action.payload || "An unknown error occurred."
    //   );
    // },
    // receiveSourceParsedTokenAccounts: (
    //   state: TransferState,
    //   action: PayloadAction<ParsedTokenAccount[]>
    // ) => {
    //   state.sourceParsedTokenAccounts = receiveDataWrapper(action.payload);
    // },
    // setAmount: (state: TransferState, action: PayloadAction<string>) => {
    //   state.amount = action.payload;
    // },
    // setTargetChain: (state: TransferState, action: PayloadAction<ChainId>) => {
    //   const prevTargetChain = state.targetChain;
    //   state.targetChain = action.payload;
    //   state.targetAddressHex = undefined;
    //   // clear targetAsset so that components that fire before useFetchTargetAsset don't get stale data
    //   // state.targetAsset = undefined;
    //   state.targetParsedTokenAccount = undefined;
    //   if (state.sourceChain === action.payload) {
    //     state.sourceChain = prevTargetChain;
    //     state.activeStep = 0;
    //     state.sourceParsedTokenAccount = undefined;
    //     state.isSourceAssetWormholeWrapped = undefined;
    //     state.originChain = undefined;
    //     state.originAsset = undefined;
    //     state.sourceParsedTokenAccounts = undefined;
    //   }
    // },
    // setTargetAddressHex: (state: TransferState, action: PayloadAction<string | undefined>) => {
    //   state.targetAddressHex = action.payload;
    // },
    // setTargetAsset: (
    //   state: TransferState,
    //   // action: PayloadAction<DataWrapper<ForeignAssetInfo>>
    // ) => {
    //   state.targetAsset = action.payload;
    //   state.targetParsedTokenAccount = undefined;
    // },
    // setTargetParsedTokenAccount: (
    //   state: TransferState,
    //   action: PayloadAction<ParsedTokenAccount | undefined>
    // ) => {
    //   state.targetParsedTokenAccount = action.payload;
    // },
    // setTransferTx: (state: TransferState, action: PayloadAction<Transaction>) => {
    //   state.transferTx = action.payload;
    // },
    // setSignedVAAHex: (state: TransferState, action: PayloadAction<string>) => {
    //   state.signedVAAHex = action.payload;
    //   state.isSending = false;
    //   state.isVAAPending = false;
    //   state.activeStep = 3;
    // },
    // setIsSending: (state: TransferState, action: PayloadAction<boolean>) => {
    //   state.isSending = action.payload;
    // },
    // setIsVAAPending: (state: TransferState, action: PayloadAction<boolean>) => {
    //   state.isVAAPending = action.payload;
    // },
    // setIsRedeeming: (state: TransferState, action: PayloadAction<boolean>) => {
    //   state.isRedeeming = action.payload;
    // },
    // setRedeemTx: (state: TransferState, action: PayloadAction<Transaction>) => {
    //   state.redeemTx = action.payload;
    //   state.isRedeeming = false;
    // },
    // setIsApproving: (state: TransferState, action: PayloadAction<boolean>) => {
    //   state.isApproving = action.payload;
    // },
    // reset: (state: TransferState) => ({
    //   ...initialState,
    //   sourceChain: state.sourceChain,
    //   targetChain: state.targetChain,
    // }),
    // setRecoveryVaa: (
    //   state: TransferState,
    //   action: PayloadAction<{
    //     vaa: any;
    //     useRelayer: boolean;
    //     parsedPayload: {
    //       targetChain: ChainId;
    //       targetAddress: string;
    //       originChain: ChainId;
    //       originAddress: string;
    //       amount: string;
    //     };
    //   }>
    // ) => {
    //   const prevTargetChain = state.targetChain;
    //   state.signedVAAHex = action.payload.vaa;
    //   state.targetChain = action.payload.parsedPayload.targetChain;
    //   if (state.sourceChain === action.payload.parsedPayload.targetChain) {
    //     state.sourceChain = prevTargetChain;
    //   }
    //   state.sourceParsedTokenAccount = undefined;
    //   state.sourceParsedTokenAccounts = getEmptyDataWrapper();
    //   // clear targetAsset so that components that fire before useFetchTargetAsset don't get stale data
    //   state.targetAsset = getEmptyDataWrapper();
    //   state.targetParsedTokenAccount = undefined;
    //   state.isSourceAssetWormholeWrapped = undefined;
    //   state.targetAddressHex = action.payload.parsedPayload.targetAddress;
    //   state.originChain = action.payload.parsedPayload.originChain;
    //   state.originAsset = action.payload.parsedPayload.originAddress;
    //   state.amount = action.payload.parsedPayload.amount;
    //   state.activeStep = 3;
    //   state.isRecovery = true;
    //   state.useRelayer = action.payload.useRelayer;
    // },
    // setGasPrice: (state: TransferState, action: PayloadAction<number | undefined>) => {
    //   state.gasPrice = action.payload;
    // },
    // setUseRelayer: (state: TransferState, action: PayloadAction<boolean | undefined>) => {
    //   state.useRelayer = !!action.payload;
    // },
    // setRelayerFee: (state: TransferState, action: PayloadAction<string | undefined>) => {
    //   state.relayerFee = action.payload;
    // },
    // setAcalaRelayerInfo: (
    //   state: TransferState,
    //   action: PayloadAction<AcalaRelayerInfo | undefined>
    // ) => {
    //   state.acalaRelayerInfo = action.payload
    //     ? receiveDataWrapper(action.payload)
    //     : getEmptyDataWrapper();
    // },
    // fetchAcalaRelayerInfo: (state) => {
    //   state.acalaRelayerInfo = fetchDataWrapper();
    // },
    // errorAcalaRelayerInfo: (
    //   state: TransferState,
    //   action: PayloadAction<string | undefined>
    // ) => {
    //   state.acalaRelayerInfo = errorDataWrapper(
    //     action.payload || "An unknown error occurred."
    //   );
    // },
    // receiveAcalaRelayerInfo: (
    //   state: TransferState,
    //   action: PayloadAction<AcalaRelayerInfo>
    // ) => {
    //   state.acalaRelayerInfo = receiveDataWrapper(action.payload);
    // },
  },
});

export const {
  incrementStep,
  decrementStep,
  setStep,
  // setSourceChain,
  // setSourceWormholeWrappedInfo,
  // setSourceWalletAddress,
  // setSourceParsedTokenAccount,
  // setSourceParsedTokenAccounts,
  // receiveSourceParsedTokenAccounts,
  // errorSourceParsedTokenAccounts,
  // fetchSourceParsedTokenAccounts,
  // setAmount,
  // setTargetChain,
  // setTargetAddressHex,
  // setTargetAsset,
  // setTargetParsedTokenAccount,
  // setTransferTx,
  // setSignedVAAHex,
  // setIsSending,
  // setIsVAAPending,
  // setIsRedeeming,
  // setRedeemTx,
  // setIsApproving,
  // reset,
  // setRecoveryVaa,
  // setGasPrice,
  // setUseRelayer,
  // setRelayerFee,
  // setAcalaRelayerInfo,
  // fetchAcalaRelayerInfo,
  // errorAcalaRelayerInfo,
  // receiveAcalaRelayerInfo,
} = transferSlice.actions;

export default transferSlice.reducer;
