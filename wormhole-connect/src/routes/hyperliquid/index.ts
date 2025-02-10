/* eslint-disable @typescript-eslint/no-namespace */
import { Quote as MayanQuote } from '@mayanfinance/swap-sdk';
import { MayanRouteSWIFT } from '@mayanfinance/wormhole-sdk-route';
import { TransactionStatus } from '@mayanfinance/wormhole-sdk-route/dist/esm/utils';
import {
  amount,
  type Chain,
  type ChainAddress,
  type ChainContext,
  isAttested,
  isCompleted,
  isSignAndSendSigner,
  isSignOnlySigner,
  nativeChainIds,
  type Network,
  routes,
  type Signer,
  type TokenId,
  type TransactionId,
  TransferState,
  Wormhole,
} from '@wormhole-foundation/sdk-connect';
import {
  addChainId,
  EvmChains,
  EvmPlatform,
  EvmUnsignedTransaction,
} from '@wormhole-foundation/sdk-evm';
import { circle } from '@wormhole-foundation/sdk';

export namespace HyperliquidRoute {
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

type Op = HyperliquidRoute.Options;
type Vp = HyperliquidRoute.ValidatedParams;
type Q = routes.Quote<Op, Vp, MayanQuote>;
type QR = routes.QuoteResult<Op, Vp, MayanQuote>;
type R = routes.Receipt;

type Tp = routes.TransferParams<Op>;
type Vr = routes.ValidationResult<Op>;

// Hyperliquid bridge on Arbitrum
const HL_BRIDGE_ARB = '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7';
// Minimum USDC amount required for Hyperliquid deposits
const MIN_AMOUNT_REQUIRED = {
  amount: '5000000',
  decimals: 6,
};

export class HyperliquidRoute<N extends Network>
  extends routes.ManualRoute<N, Op, Vp, R>
  implements routes.StaticRouteMethods<typeof HyperliquidRoute>
{
  mayanRoute: MayanRouteSWIFT<N>;
  finalReceipt: routes.Receipt | undefined;

  constructor(wh: Wormhole<N>) {
    super(wh);
    this.mayanRoute = new MayanRouteSWIFT(wh);
  }

  static meta = { name: 'HyperliquidRoute' };

  // Get default options for this route
  getDefaultOptions(): Op {
    return this.mayanRoute.getDefaultOptions();
  }

  // Get the list of networks this route supports
  static supportedNetworks(): Network[] {
    return MayanRouteSWIFT.supportedNetworks();
  }

  // Get the list of chains this route supports
  static supportedChains(network: Network): Chain[] {
    return MayanRouteSWIFT.supportedChains(network);
  }

  // Get the list of source tokens that are possible to send
  static async supportedSourceTokens(
    fromChain: ChainContext<Network>,
  ): Promise<TokenId[]> {
    return MayanRouteSWIFT.supportedSourceTokens(fromChain);
  }

  // Get the list of source tokens that are possible to receive
  static async supportedDestinationTokens<N extends Network>(
    _sourceToken: TokenId,
    _fromChain: ChainContext<N>,
    _toChain: ChainContext<N>,
  ): Promise<TokenId[]> {
    // HL route supports only USDCarbitrum as destination token
    return [
      Wormhole.tokenId(
        'Arbitrum',
        circle.usdcContract.get('Mainnet', 'Arbitrum')!,
      ),
    ];
  }

  async validate(
    request: routes.RouteTransferRequest<N>,
    params: Tp,
  ): Promise<Vr> {
    return this.mayanRoute.validate(request, params);
  }

  async quote(
    request: routes.RouteTransferRequest<N>,
    params: Vp,
  ): Promise<QR> {
    const quoteResult = await this.mayanRoute.quote(request, params);
    const minRequiredOut = amount.whole(MIN_AMOUNT_REQUIRED);
    if (
      quoteResult.success &&
      quoteResult.details &&
      quoteResult.details.minAmountOut < minRequiredOut
    ) {
      const error = new Error(
        `Minimum transfer output amount is ${minRequiredOut} ${request.destination.symbol}`,
      );
      error['min'] = MIN_AMOUNT_REQUIRED;
      // Return error for minimum amount required
      return {
        success: false,
        error,
      };
    }

    return quoteResult;
  }

  async initiate(
    request: routes.RouteTransferRequest<N>,
    signer: Signer,
    quote: Q,
    to: ChainAddress,
  ): Promise<R> {
    // Check min amount requirement for Hyperliquid
    if (quote.details!.minReceived < 5) {
      throw new Error('Hyperliquid requires a minimum of 5 USDC to deposit');
    }

    return (await this.mayanRoute.initiate(
      request,
      signer,
      quote,
      to,
    )) as routes.Receipt;
  }

  async complete(signer: Signer, receipt: R): Promise<R> {
    if (!isAttested(receipt)) {
      throw new Error('Transaction must be attested in order to be completed');
    }

    const txs: TransactionId[] = [];
    const txReqs: EvmUnsignedTransaction<N, EvmChains>[] = [];

    try {
      const arb = this.wh.getChain('Arbitrum');
      const rpc = await arb.getRpc();
      const txStatus = receipt['txstatus'] as TransactionStatus;

      const usdcToken = EvmPlatform.getTokenImplementation(
        rpc,
        circle.usdcContract.get('Mainnet', 'Arbitrum')!,
      );

      const amountToDeposit = amount.parse(txStatus.toAmount, 6);
      const txReq = await usdcToken.transfer.populateTransaction(
        HL_BRIDGE_ARB,
        amount.units(amountToDeposit),
      );

      const nativeChainId = nativeChainIds.networkChainToNativeChainId.get(
        arb.network,
        arb.chain,
      ) as bigint;

      txReqs.push(
        new EvmUnsignedTransaction(
          addChainId(txReq, nativeChainId),
          arb.network,
          arb.chain as EvmChains,
          'Hyperliquid deposit',
        ),
      );

      if (isSignAndSendSigner(signer)) {
        const txids = await signer.signAndSend(txReqs);
        txs.push(
          ...txids.map((txid) => ({
            chain: arb.chain,
            txid,
          })),
        );
      } else if (isSignOnlySigner(signer)) {
        const signed = await signer.sign(txReqs);
        const txids = await EvmPlatform.sendWait(arb.chain, rpc, signed);
        txs.push(
          ...txids.map((txid) => ({
            chain: arb.chain,
            txid,
          })),
        );
      }

      const finalReceipt: routes.Receipt = {
        ...receipt,
        state: TransferState.DestinationFinalized,
        destinationTxs: txs,
      };

      this.finalReceipt = finalReceipt;
      return finalReceipt;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  // At the time a user wants to resume a Hyperliquid route,
  // there is no way we can tell whether the manual claim is already completed.
  async resume(_txid: TransactionId): Promise<R> {
    throw new Error('Hyperliquid route transactions cannot be resumed.');
  }

  override transferUrl(txid: string): string {
    return this.mayanRoute.transferUrl(txid);
  }

  public override async *track(receipt: R, timeout?: number) {
    let trackReceipt;
    for await (const mayanReceipt of this.mayanRoute.track(receipt, timeout)) {
      if (isCompleted(mayanReceipt as routes.Receipt)) {
        // Mayan tx is completed
        if (this.finalReceipt) {
          // final receipt is set after manual claim is completed (see async complete(...))
          trackReceipt = this.finalReceipt;
        } else {
          // Mayan tx is completed but manual claim is still pending
          // In this case we need to override and continue to return attested state
          trackReceipt = {
            ...mayanReceipt,
            state: TransferState.Attested,
          };
        }
      } else {
        // Mayan tx is not completed, return current receipt
        trackReceipt = mayanReceipt;
      }
      break;
    }

    yield trackReceipt;
  }
}
