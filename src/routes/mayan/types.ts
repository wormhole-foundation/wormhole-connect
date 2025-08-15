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

  // For temp feature flagging only
  isNewSolanaReferralEnabled?: boolean; // To be removed eventually
  isNewSuiReferralEnabled?: boolean; // To be removed eventually
  isNewEvmReferralEnabled?: boolean; // To be removed eventually
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
