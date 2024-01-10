import { BigNumber } from 'ethers';
import { TransferDestInfo } from 'routes/types';

export interface CreateOrderRequest {
  startingChainId: number;
  startingToken: string;
  startingTokenAmount: string;
  destinationToken: string;
  destinationAddress: string;
  destinationChainId: number;
  relayerFee: string;
  feeTierStart: number;
  feeTierEnd: number;
  minAmountStart: string;
  minAmountEnd: string;
  bridgeNonce: number;
  shouldWrapNative: boolean;
  shouldUnwrapNative: boolean;
  porticoAddress: string;
  destinationPorticoAddress: string;
}

export interface CreateOrderResponse {
  transactionData: string;
  transactionTarget: string;
  transactionValue: string;
  startParameters: string[];
  estimatedAmountOut: string;
}

export interface PorticoTradeParameters {
  flagSet: PorticoFlagSet;
  startTokenAddress: string;
  canonAssetAddress: string;
  finalTokenAddress: string;
  recipientAddress: string;
  destinationPorticoAddress: string;
  amountSpecified: BigNumber;
  minAmountStart: BigNumber;
  minAmountFinish: BigNumber;
  relayerFee: BigNumber;
}

export interface PorticoFlagSet {
  recipientChain: number;
  bridgeNonce: number;
  feeTierStart: number;
  feeTierFinish: number;
  shouldWrapNative: boolean;
  shouldUnwrapNative: boolean;
}

export interface PorticoPayload {
  flagSet: PorticoFlagSet;
  finalTokenAddress: string;
  recipientAddress: string;
  canonAssetAmount: BigNumber;
  minAmountFinish: BigNumber;
  relayerFee: BigNumber;
}

export interface RelayerQuoteRequest {
  targetChain: number;
  sourceToken: string;
  targetToken: string;
}

export interface RelayerQuoteResponse {
  fee: string;
  validUntil: string;
}

export type PorticoTransferDestInfo = TransferDestInfo & {
  destTxInfo: PorticoDestTxInfo;
};

export interface PorticoDestTxInfo {
  receivedTokenKey: string; // this is the key of the token that was received (e.g. the token that was swapped for)
  swapFailed?: {
    canonicalTokenAddress: string;
    finalTokenAddress: string;
  };
}
