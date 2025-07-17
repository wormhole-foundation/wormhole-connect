import { Chain, Network, routes } from '@wormhole-foundation/sdk';
import { Quote as MayanQuote } from '@mayanfinance/swap-sdk';

export namespace MayanRoute {
  export type Options = {
    gasDrop: number;
    slippageBps: number | 'auto';
    optimizeFor: 'cost' | 'speed';
  };
  export type NormalizedParams = {
    slippageBps: number | 'auto';
  };
  export interface ValidatedParams
    extends routes.ValidatedTransferParams<Options> {
    normalizedParams: NormalizedParams;
  }
}

export type Op = MayanRoute.Options;
export type Vp = MayanRoute.ValidatedParams;
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
