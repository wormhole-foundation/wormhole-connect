import type { QuoteRequest, LiFiStep } from '@lifi/sdk';
import {
  getQuote,
  convertQuoteToRoute,
  config as lifiSdkConfig,
} from '@lifi/sdk';

import type {
  Chain,
  ChainAddress,
  ChainContext,
  Network,
  Signer,
  TokenId,
  TransactionId,
  AttestationReceipt,
  CompletedTransferReceipt,
  RefundedTransferReceipt,
} from '@wormhole-foundation/sdk-connect';
import {
  TransferState,
  canonicalAddress,
  isAttested,
  isCompleted,
  isRedeemed,
  isRefunded,
  isSourceFinalized,
  isSourceInitiated,
  routes,
  amount as sdkAmount,
} from '@wormhole-foundation/sdk-connect';
import {
  getTransactionStatus,
  supportedChains,
  toLifiChainId,
  toLifiTokenAddress,
  generateThrowawayAddress,
  getNativeChainId,
} from './utils';
import {
  DEFAULT_SLIPPAGE_PERCENT,
  DEFAULT_MAX_PRICE_IMPACT_PERCENT,
  DEFAULT_ETA_SECONDS,
  DEFAULT_TIMEOUT,
  DEFAULT_BRIDGES,
  DEFAULT_EXCHANGES,
  MILLISECONDS_PER_SECOND,
  POLLING_INTERVAL_MS,
  DEFAULT_INTEGRATOR,
  DEFAULT_API_URL,
} from './consts';
import type {
  Options,
  PlatformContext,
  Quote,
  QuoteResult,
  Receipt,
  TransferParams,
  ValidatedParams,
  ValidationResult,
  LiFiConfig,
  LiFiFeeConfig,
} from './types';
import { getAllTokenIdsForChain } from 'utils/tokenHelpers';
import { sleep } from 'utils';
import { executeEvmSteps } from './platforms/evm';
import { executeSuiSteps } from './platforms/sui';
import { executeSolanaSteps } from './platforms/svm';

export class LiFiRoute<N extends Network>
  extends routes.AutomaticRoute<N, Options, ValidatedParams, Receipt>
  implements routes.StaticRouteMethods<typeof LiFiRoute>
{
  static meta = {
    name: 'LiFi',
    provider: 'LI.FI',
  };

  static NATIVE_GAS_DROPOFF_SUPPORTED = false;
  static override IS_AUTOMATIC = true;

  config?: LiFiConfig<Network>;

  getDefaultOptions(): Options {
    return {
      slippage: DEFAULT_SLIPPAGE_PERCENT,
      maxPriceImpact: DEFAULT_MAX_PRICE_IMPACT_PERCENT,
      allowDestinationCall: false,
    };
  }

  static supportedNetworks(): Network[] {
    return ['Mainnet'];
  }

  static supportedChains(network: Network): Chain[] {
    return supportedChains(network);
  }

  static isProtocolSupported<N extends Network>(
    chain: ChainContext<N>,
  ): boolean {
    return supportedChains(chain.network).includes(chain.chain);
  }

  // LiFi can handle any input and output token that has liquidity on a DeX
  static async supportedDestinationTokens<N extends Network>(
    _token: TokenId,
    _fromChain: ChainContext<N>,
    toChain: ChainContext<N>,
  ): Promise<TokenId[]> {
    return getAllTokenIdsForChain(toChain.chain);
  }

  async validate(
    request: routes.RouteTransferRequest<N>,
    params: TransferParams,
  ): Promise<ValidationResult> {
    const isSameChainSwap = request.fromChain.chain === request.toChain.chain;
    if (isSameChainSwap) {
      return {
        valid: false,
        params,
        error: new Error('Same chain swaps are disabled'),
      };
    }

    const slippage = params.options?.slippage ?? DEFAULT_SLIPPAGE_PERCENT;
    const isSlippageInvalid = slippage < 0 || slippage > 1;
    if (isSlippageInvalid) {
      return {
        valid: false,
        params,
        error: new Error('Invalid slippage value'),
      };
    }

    const maxPriceImpact =
      params.options?.maxPriceImpact ?? DEFAULT_MAX_PRICE_IMPACT_PERCENT;
    const isMaxPriceImpactInvalid = maxPriceImpact < 0 || maxPriceImpact > 1;
    if (isMaxPriceImpactInvalid) {
      return {
        valid: false,
        params,
        error: new Error('Invalid maxPriceImpact value'),
      };
    }

    const bridges = params.options?.bridges ?? DEFAULT_BRIDGES;
    const exchanges = params.options?.exchanges ?? DEFAULT_EXCHANGES;

    return {
      valid: true,
      params: {
        ...params,
        normalizedParams: {
          slippage,
          maxPriceImpact,
          bridges,
          exchanges,
        },
      },
    } as ValidationResult;
  }

  fetchQuote(
    request: routes.RouteTransferRequest<N>,
    params: ValidatedParams,
  ): Promise<LiFiStep> {
    const { fromChain, toChain } = request;
    const { normalizedParams } = params;

    const fromChainId = toLifiChainId(fromChain.chain);
    const toChainId = toLifiChainId(toChain.chain);

    // Generate throwaway addresses if sender/recipient not provided
    const fromAddress = request.sender
      ? canonicalAddress(request.sender)
      : generateThrowawayAddress(fromChain.chain);
    const toAddress = request.recipient
      ? canonicalAddress(request.recipient)
      : generateThrowawayAddress(toChain.chain);

    const { integrator, feePercent } = this.getFeeConfig(request);

    const quoteRequest: QuoteRequest = {
      fromChain: fromChainId,
      toChain: toChainId,
      fromToken: toLifiTokenAddress(request.source.id),
      toToken: toLifiTokenAddress(request.destination.id),
      fromAmount: sdkAmount
        .units(request.parseAmount(params.amount))
        .toString(),
      fromAddress,
      toAddress,
      slippage: params.normalizedParams.slippage,
      maxPriceImpact: params.normalizedParams.maxPriceImpact,
      integrator,
      referrer: params.options.referrer,
      fee: feePercent,
    };

    // Lifi SDK has a AllowDenyPrefer type but then it's converted into a different format for quote requests...
    if (normalizedParams.bridges?.allow)
      quoteRequest.allowBridges = normalizedParams.bridges.allow;
    if (normalizedParams.bridges?.deny)
      quoteRequest.denyBridges = normalizedParams.bridges.deny;
    if (normalizedParams.bridges?.prefer)
      quoteRequest.preferBridges = normalizedParams.bridges.prefer;
    if (normalizedParams.exchanges?.allow)
      quoteRequest.allowExchanges = normalizedParams.exchanges.allow;
    if (normalizedParams.exchanges?.deny)
      quoteRequest.denyExchanges = normalizedParams.exchanges.deny;
    if (normalizedParams.exchanges?.prefer)
      quoteRequest.preferExchanges = normalizedParams.exchanges.prefer;

    return getQuote(quoteRequest);
  }

  getFeeConfig(request: routes.RouteTransferRequest<N>): LiFiFeeConfig {
    if (!this.config?.getFeeConfig) {
      return { integrator: DEFAULT_INTEGRATOR, feePercent: 0 };
    }

    return this.config.getFeeConfig(request);
  }

  async quote(
    request: routes.RouteTransferRequest<N>,
    params: ValidatedParams,
  ): Promise<QuoteResult> {
    try {
      const quote = await this.fetchQuote(request, params);

      const fullQuote: Quote = {
        success: true,
        params,
        sourceToken: {
          token: request.source.id,
          amount: sdkAmount.fromBaseUnits(
            BigInt(quote.estimate?.fromAmount.toString()),
            request.source.decimals,
          ),
        },
        destinationToken: {
          token: request.destination.id,
          amount: sdkAmount.fromBaseUnits(
            BigInt(quote.estimate?.toAmount.toString()),
            request.destination.decimals,
          ),
        },
        eta:
          (quote.estimate?.executionDuration || DEFAULT_ETA_SECONDS) *
          MILLISECONDS_PER_SECOND,
        details: quote,
      };

      return fullQuote;
    } catch (e: any) {
      return {
        success: false,
        error: e as Error,
      };
    }
  }

  async initiate(
    request: routes.RouteTransferRequest<N>,
    signer: Signer<N>,
    quote: Quote,
    to: ChainAddress,
  ) {
    const originAddress = signer.address();
    const destinationAddress = canonicalAddress(to);

    const rpc = await request.fromChain.getRpc();
    const txs: TransactionId[] = [];

    // Update quote with actual addresses
    const updatedQuote = {
      ...quote.details!,
      fromAddress: originAddress,
      toAddress: destinationAddress,
    };

    // Convert quote to route
    const route = convertQuoteToRoute(updatedQuote);
    const context: PlatformContext<N> = { request, signer, rpc, txs };

    if (request.fromChain.chain === 'Solana') {
      await executeSolanaSteps(route, context);
    } else if (request.fromChain.chain === 'Sui') {
      await executeSuiSteps(route, context);
    } else {
      const nativeChainId = await getNativeChainId(request.fromChain);
      await executeEvmSteps(
        route,
        context,
        quote,
        nativeChainId,
        toLifiTokenAddress,
      );
    }

    const receipt = {
      from: request.fromChain.chain,
      to: request.toChain.chain,
      state: TransferState.SourceInitiated,
      originTxs: txs,
      // TODO: The LiFi API status method has a known issue where it sometimes can't track
      // transfers when no bridge param is specified.
      // Set it here on the receipt for the track() method below.
      // Can remove this when the LiFi API is fixed.
      tool: quote.details!.tool,
    } satisfies Receipt;

    return Object.assign(receipt, { tool: quote.details?.tool as string });
  }

  public override async *track(
    receipt: Receipt,
    timeout: number = DEFAULT_TIMEOUT,
  ) {
    if (isCompleted(receipt) || isRedeemed(receipt) || isRefunded(receipt))
      return receipt;

    let leftover = timeout;
    while (leftover > 0) {
      const start = Date.now();

      if (
        isSourceInitiated(receipt) ||
        isSourceFinalized(receipt) ||
        isAttested(receipt)
      ) {
        const txStatus = await getTransactionStatus(
          this.wh.network,
          receipt.originTxs[receipt.originTxs.length - 1]!,
          toLifiChainId(receipt.from).toString(),
          toLifiChainId(receipt.to).toString(),
          receipt.tool,
        );

        if (!txStatus) {
          throw new Error('Failed to fetch transfer status');
        }

        if (txStatus.status === 'DONE') {
          const completedReceipt = {
            ...receipt,
            originTxs: [{ chain: receipt.from, txid: txStatus.sending.txHash }],
            attestation: {} as AttestationReceipt<'WormholeCore'>,
            state: TransferState.DestinationFinalized,
          } satisfies CompletedTransferReceipt<any>;
          yield completedReceipt;
          return completedReceipt;
        } else if (txStatus.status === 'FAILED') {
          const failedReceipt = {
            ...receipt,
            originTxs: [{ chain: receipt.from, txid: txStatus.sending.txHash }],
            refundTxs: [],
            state: TransferState.Refunded,
            attestation: {} as AttestationReceipt<'WormholeCore'>,
          } satisfies RefundedTransferReceipt<any>;
          yield failedReceipt;
          return failedReceipt;
        }
      }

      await sleep(POLLING_INTERVAL_MS);
      leftover -= Date.now() - start;
    }

    return receipt;
  }

  override transferUrl(txid: string): string {
    return `https://scan.li.fi/tx/${txid}`;
  }
}

export function createLiFiRouteWithConfig(
  config: LiFiConfig<Network>,
): routes.RouteConstructor {
  // We are calling this instead of `createConfig` from the LiFi SDK
  // to avoid extra network calls to fetch chains which we don't need.
  lifiSdkConfig.set({
    // The integrator is required here so just set it to the default.
    // The actual integrator used will be set per-quote in fetchQuote().
    integrator: DEFAULT_INTEGRATOR,
    apiUrl: config.apiUrl ?? DEFAULT_API_URL,
  });

  return class ConfiguredLiFiRoute<N extends Network> extends LiFiRoute<N> {
    override config = config as LiFiConfig<Network>;
  };
}
