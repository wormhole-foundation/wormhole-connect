import type { Quote as MayanQuote } from '@mayanfinance/swap-sdk';
import type { Chain, Network, routes } from '@wormhole-foundation/sdk-connect';

export type Op = MayanRouteOptions;
export type Vp = MayanRouteValidatedParams;
export type Q = routes.Quote<Op, Vp, MayanQuote>;
export type QR = routes.QuoteResult<Op, Vp, MayanQuote>;
export type R = routes.Receipt;

export type Tp = routes.TransferParams<Op>;
export type Vr = routes.ValidationResult<Op>;

export type MayanProtocol =
  | 'WH'
  | 'MCTP'
  | 'SWIFT'
  | 'FAST_MCTP'
  | 'SHUTTLE'
  | 'MONO_CHAIN';

export type ReferrerParams<N extends Network> = {
  getReferrerBps?: (request: routes.RouteTransferRequest<N>) => number;
  referrers?: Partial<Record<Chain, string>>;
};

export interface MayanRouteOptions {
  gasDrop: number;
  slippageBps: number | 'auto';
  optimizeFor: 'cost' | 'speed';
}

export interface MayanRouteNormalizedParams {
  slippageBps: number | 'auto';
}

export interface MayanRouteValidatedParams
  extends routes.ValidatedTransferParams<MayanRouteOptions> {
  normalizedParams: MayanRouteNormalizedParams;
}
export enum MayanTransactionGoal {
  // send from evm to solana
  Send = 'SEND',
  // bridge to destination chain
  Bridge = 'BRIDGE',
  // perform the swap
  Swap = 'SWAP',
  // register for auction
  Register = 'REGISTER',
  // settle on destination
  Settle = 'SETTLE',
}

export interface TransactionStatus {
  id: string;
  trader: string;

  sourceChain: string;
  sourceTxHash: string;
  sourceTxBlockNo: number;

  transferSequence: string;
  swapSequence: string;
  redeemSequence: string;
  refundSequence: string;
  fulfillSequence: string;

  deadline: string;

  swapChain: string;
  refundChain: string;

  destChain: string;
  destAddress: string;

  fromTokenAddress: string;
  fromTokenChain: string;
  fromTokenSymbol: string;
  fromAmount: string;
  fromAmount64: any;

  toTokenAddress: string;
  toTokenChain: string;
  toTokenSymbol: string;

  stateAddr: string;
  stateNonce: string;

  toAmount: any;

  transferSignedVaa: string;
  swapSignedVaa: string;
  redeemSignedVaa: string;
  refundSignedVaa: string;
  fulfillSignedVaa: string;

  savedAt: string;
  initiatedAt: string;
  completedAt: string;
  insufficientFees: boolean;
  retries: number;

  swapRelayerFee: string;
  redeemRelayerFee: string;
  refundRelayerFee: string;
  bridgeFee: string;

  statusUpdatedAt: string;

  redeemTxHash: string;
  refundTxHash: string;
  fulfillTxHash: string;

  unwrapRedeem: boolean;
  unwrapRefund: boolean;

  auctionAddress: string;
  driverAddress: string;
  mayanAddress: string;
  referrerAddress: string;
  auctionStateAddr: any;

  auctionStateNonce: any;

  gasDrop: string;
  gasDrop64: any;

  payloadId: number;
  orderHash: string;

  minAmountOut: any;
  minAmountOut64: any;

  service: string;

  refundAmount: string;

  posAddress: string;

  unlockRecipient: any;

  fromTokenLogoUri: string;
  toTokenLogoUri: string;

  fromTokenScannerUrl: string;
  toTokenScannerUrl: string;

  txs: Tx[];

  clientStatus: MayanClientStatus;
}

export interface Tx {
  txHash: string;
  goals: MayanTransactionGoal[];
  scannerUrl: string;
}

export enum MayanClientStatus {
  INPROGRESS = 'INPROGRESS',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  CANCELED = 'CANCELED',
}
