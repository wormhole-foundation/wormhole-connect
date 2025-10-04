import type { AllowDenyPrefer } from '@lifi/sdk';
import type {
  Network,
  routes,
  Signer,
  TransactionId,
} from '@wormhole-foundation/sdk-connect';

export interface PlatformContext<N extends Network> {
  request: routes.RouteTransferRequest<N>;
  signer: Signer<N>;
  rpc: any;
  txs: TransactionId[];
}

export type Options = {
  slippage?: number;
  maxPriceImpact?: number;
  allowDestinationCall?: boolean;
  referrer?: string;
  fee?: number;
  bridges?: AllowDenyPrefer;
  exchanges?: AllowDenyPrefer;
};

export type NormalizedParams = {
  slippage: number;
  maxPriceImpact: number;
  bridges: AllowDenyPrefer;
  exchanges: AllowDenyPrefer;
};

export interface ValidatedParams
  extends routes.ValidatedTransferParams<Options> {
  normalizedParams: NormalizedParams;
}

export type Quote = routes.Quote<Options, ValidatedParams, any>;
export type QuoteResult = routes.QuoteResult<Options, ValidatedParams, any>;
export type Receipt = routes.Receipt & { tool: string };

export type TransferParams = routes.TransferParams<Options>;
export type ValidationResult = routes.ValidationResult<Options>;

export interface LiFiConfig<N extends Network> {
  apiUrl?: string;
  getIntegrator?: (request: routes.RouteTransferRequest<N>) => string;
}
