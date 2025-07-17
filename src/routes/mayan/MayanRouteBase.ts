import {
  Quote as MayanQuote,
  QuoteParams,
  ReferrerAddresses,
  addresses,
  createSwapFromSolanaInstructions,
  createSwapFromSuiMoveCalls,
  generateFetchQuoteUrl,
  getSwapFromEvmTxPayload,
} from '@mayanfinance/swap-sdk';
import {
  generateFetchQuoteUrl as generateFetchQuoteUrlTestnet,
  createSwapFromSolanaInstructions as createSwapFromSolanaInstructionsTestnet,
  createSwapFromSuiMoveCalls as createSwapFromSuiMoveCallsTestnet,
  getSwapFromEvmTxPayload as getSwapFromEvmTxPayloadTestnet,
} from '@testnet-mayan/swap-sdk';

import { MessageV0, PublicKey, VersionedTransaction } from '@solana/web3.js';
import {
  Chain,
  ChainAddress,
  ChainContext,
  Network,
  Signer,
  SourceInitiatedTransferReceipt,
  TokenId,
  TransactionId,
  TransferState,
  Wormhole,
  amount,
  canonicalAddress,
  isAttested,
  isCompleted,
  isNative,
  isRedeemed,
  isRefunded,
  isSignAndSendSigner,
  isSignOnlySigner,
  isSourceFinalized,
  isSourceInitiated,
  nativeChainIds,
  routes,
  circle,
} from '@wormhole-foundation/sdk';
import {
  EvmChains,
  EvmPlatform,
  EvmUnsignedTransaction,
} from '@wormhole-foundation/sdk-evm';
import {
  SolanaPlatform,
  SolanaUnsignedTransaction,
} from '@wormhole-foundation/sdk-solana';
import {
  SuiPlatform,
  SuiUnsignedTransaction,
} from '@wormhole-foundation/sdk-sui';
import axios from 'axios';
import {
  getNativeContractAddress,
  getTransactionStatus,
  supportedChains,
  toMayanChainName,
  isTestnetSupportedChain,
  txStatusToReceipt,
} from './utils';
import { Transaction } from '@mysten/sui/transactions';
import {
  MayanProtocol,
  Op,
  Q,
  QR,
  R,
  ReferrerParams,
  Tp,
  Vp,
  Vr,
} from './types';

export class MayanRouteBase<N extends Network> extends routes.AutomaticRoute<
  N,
  Op,
  Vp,
  R
> {
  MAX_SLIPPAGE = 1;

  static NATIVE_GAS_DROPOFF_SUPPORTED = false;
  static override IS_AUTOMATIC = true;

  protocols: MayanProtocol[] = ['WH', 'MCTP', 'SWIFT', 'MONO_CHAIN'];

  protected isTestnetRequest(request: routes.RouteTransferRequest<N>): boolean {
    // A request is considered testnet if either the source or destination chain is on testnet
    return (
      request.fromChain.network === 'Testnet' ||
      request.toChain.network === 'Testnet'
    );
  }

  // Helper function to normalize quote for testnet compatibility
  protected normalizeQuoteForTestnet(quote: MayanQuote): any {
    // Remove properties that don't exist in testnet SDK
    const { hyperCoreParams, ...testnetCompatibleQuote } = quote;
    return testnetCompatibleQuote;
  }

  getDefaultOptions(): Op {
    return {
      gasDrop: 0,
      slippageBps: 'auto',
      optimizeFor: 'speed',
    };
  }

  static supportedNetworks(): Network[] {
    return ['Mainnet', 'Testnet'];
  }

  static supportedChains(network: Network): Chain[] {
    return supportedChains(network);
  }

  // Mayan can handle any input and output token that has liquidity on a DeX
  static async supportedSourceTokens(
    _fromChain: ChainContext<Network>,
  ): Promise<TokenId[]> {
    return [];
  }

  static isProtocolSupported<N extends Network>(
    chain: ChainContext<N>,
  ): boolean {
    return supportedChains(chain.network).includes(chain.chain);
  }

  // Mayan can handle any input and output token that has liquidity on a DeX
  static async supportedDestinationTokens<N extends Network>(
    _token: TokenId,
    _fromChain: ChainContext<N>,
    _toChain: ChainContext<N>,
  ): Promise<TokenId[]> {
    return [];
  }

  async isAvailable(): Promise<boolean> {
    // No way to check relayer availability so assume true
    return true;
  }

  async validate(
    request: routes.RouteTransferRequest<N>,
    params: Tp,
  ): Promise<Vr> {
    try {
      params.options = params.options ?? this.getDefaultOptions();

      return {
        valid: true,
        params: {
          ...params,
          normalizedParams: {
            slippageBps: params.options.slippageBps,
          },
        },
      } as Vr;
    } catch (e) {
      return { valid: false, params, error: e as Error };
    }
  }

  protected toMayanAddress(tokenId: TokenId): string {
    return !isNative(tokenId.address)
      ? canonicalAddress(tokenId)
      : getNativeContractAddress(tokenId.chain);
  }

  protected async fetchQuote(
    request: routes.RouteTransferRequest<N>,
    params: Vp,
  ): Promise<MayanQuote | undefined> {
    const { fromChain, toChain } = request;

    if (this.isTestnetRequest(request)) {
      if (!isTestnetSupportedChain(fromChain.chain)) {
        throw new Error(
          `Chain ${
            fromChain.chain
          } is not supported on testnet. Supported testnet chains: ${supportedChains(
            'Testnet',
          ).join(', ')}`,
        );
      }
      if (!isTestnetSupportedChain(toChain.chain)) {
        throw new Error(
          `Chain ${
            toChain.chain
          } is not supported on testnet. Supported testnet chains: ${supportedChains(
            'Testnet',
          ).join(', ')}`,
        );
      }
    }

    const quoteParams: QuoteParams = {
      amount: Number(params.amount),
      fromToken: this.toMayanAddress(request.source.id),
      toToken: this.toMayanAddress(request.destination.id),
      /* @ts-ignore */
      fromChain: toMayanChainName(fromChain.network, fromChain.chain),
      /* @ts-ignore */
      toChain: toMayanChainName(toChain.network, toChain.chain),
      ...this.getDefaultOptions(),
      ...params.options,
      ...this.getReferralParameters(request),
      slippageBps: 'auto',
    };

    const quoteOpts = {
      swift: this.protocols.includes('SWIFT'),
      mctp: this.protocols.includes('MCTP'),
      monoChain: this.protocols.includes('MONO_CHAIN'),
    };

    const fetchQuoteUrl = new URL(
      this.isTestnetRequest(request)
        ? generateFetchQuoteUrlTestnet(
            {
              ...quoteParams,
              /* @ts-ignore */
              fromChain: toMayanChainName(fromChain.network, fromChain.chain),
              /* @ts-ignore */
              toChain: toMayanChainName(toChain.network, toChain.chain),
            },
            quoteOpts,
          )
        : generateFetchQuoteUrl(quoteParams, quoteOpts),
    );
    if (!fetchQuoteUrl) {
      throw new Error('Unable to generate fetch quote URL');
    }

    if (!fetchQuoteUrl.searchParams.has('fullList')) {
      // Attach the fullList param to fetch all quotes
      fetchQuoteUrl.searchParams.append('fullList', 'true');
    }

    const res = await axios.get(fetchQuoteUrl.toString());
    if (res.status !== 200) {
      throw new Error('Unable to fetch quote', { cause: res });
    }

    const quotes = res.data?.quotes?.filter((quote: MayanQuote) =>
      this.protocols.includes(quote.type),
    );

    if (!quotes || quotes.length === 0) return undefined;
    if (quotes.length === 1) return quotes[0];

    // Wormhole SDK routes return only a single quote, but Mayan offers multiple quotes (because
    // Mayan comprises multiple competing protocols). We sort the quotes Mayan gives us and choose
    // the best one here.
    //
    // User can provide optimizeFor option to indicate what they care about. It defaults to "cost"
    // which just optimizes for highest amount out, but it can also be set to "speed" which will
    // choose the fastest route instead.
    quotes.sort((a: MayanQuote, b: MayanQuote) => {
      if (params.options.optimizeFor === 'cost') {
        if (b.expectedAmountOut === a.expectedAmountOut) {
          // If expected amounts out are identical, fall back to speed
          /* @ts-ignore */
          return a.etaSeconds - b.etaSeconds;
        } else {
          // Otherwise sort by amount out, descending
          return b.expectedAmountOut - a.expectedAmountOut;
        }
      } else if (params.options.optimizeFor === 'speed') {
        /* @ts-ignore */
        if (a.etaSeconds === b.etaSeconds) {
          // If ETAs are identical, fall back to cost
          return b.expectedAmountOut - a.expectedAmountOut;
        } else {
          // Otherwise sort by ETA, ascending
          /* @ts-ignore */
          return a.etaSeconds - b.etaSeconds;
        }
      } else {
        // Should be unreachable
        return 0;
      }
    });

    return quotes[0];
  }

  async quote(
    request: routes.RouteTransferRequest<N>,
    params: Vp,
  ): Promise<QR> {
    try {
      const quote = await this.fetchQuote(request, params);
      if (!quote) {
        return {
          success: false,
          error: new routes.UnavailableError(
            new Error(`Couldn't fetch a quote`),
          ),
        };
      }

      // Mayan fees are complicated and they normalize them for us in USD as clientRelayerFeeSuccess
      // We return this value as-is and express it as a USDC value for the sake of formatting
      const relayFee = {
        token: {
          chain: 'Solana' as Chain,
          address: Wormhole.parseAddress(
            'Solana',
            circle.usdcContract.get(request.fromChain.network, 'Solana')!,
          ),
        },
        amount: amount.parse(
          amount.denoise(quote.clientRelayerFeeSuccess || '0', 6),
          6,
        ),
      };

      const deadline64Seconds = parseInt(quote.deadline64, 10) * 1000;
      const expires = deadline64Seconds
        ? new Date(deadline64Seconds)
        : undefined;

      const fullQuote: Q = {
        success: true,
        params,
        sourceToken: {
          token: request.source.id,
          amount: amount.parse(
            amount.denoise(quote.effectiveAmountIn, quote.fromToken.decimals),
            quote.fromToken.decimals,
          ),
        },
        destinationToken: {
          token: request.destination.id,
          amount: amount.parse(
            amount.denoise(quote.expectedAmountOut, quote.toToken.decimals),
            quote.toToken.decimals,
          ),
        },
        relayFee,
        destinationNativeGas: amount.parse(
          amount.denoise(quote.gasDrop, quote.toToken.decimals),
          quote.toToken.decimals,
        ),
        eta: quote.etaSeconds * 1000,
        details: quote,
        expires,
      };
      return fullQuote;
    } catch (e: any) {
      if (axios.isAxiosError(e)) {
        const data = e?.response?.data;

        if (data?.code === 'AMOUNT_TOO_SMALL') {
          // When amount is too small, Mayan SDK returns errors in this format:
          //
          // {
          //   code: "AMOUNT_TOO_SMALL",
          //   data: { minAmountIn: 0.00055 },
          //   message: "Amount too small (min ~0.00055 ETH)"
          // }
          //
          // We parse this and return a standardized Wormhole SDK MinAmountError

          const minAmountIn = data?.data?.minAmountIn;

          if (typeof minAmountIn === 'number') {
            const minAmount = amount.parse(
              minAmountIn,
              request.source.decimals,
            );

            return {
              success: false,
              error: new routes.MinAmountError(minAmount),
            };
          }
        }

        if (data?.msg) {
          return {
            success: false,
            error: Error(data?.msg, { cause: data }),
          };
        }
      }

      return {
        success: false,
        error: e as Error,
      };
    }
  }

  async initiate(
    request: routes.RouteTransferRequest<N>,
    signer: Signer<N>,
    quote: Q,
    to: ChainAddress,
  ) {
    const originAddress = signer.address();
    const destinationAddress = canonicalAddress(to);

    try {
      const rpc = await request.fromChain.getRpc();
      const txs: TransactionId[] = [];
      if (request.fromChain.chain === 'Solana') {
        const { instructions, signers, lookupTables } =
          await (this.isTestnetRequest(request)
            ? createSwapFromSolanaInstructionsTestnet(
                this.normalizeQuoteForTestnet(quote.details!),
                originAddress,
                destinationAddress,
                this.referrerAddress(),
                rpc,
                { allowSwapperOffCurve: true },
              )
            : createSwapFromSolanaInstructions(
                quote.details!,
                originAddress,
                destinationAddress,
                this.referrerAddress(),
                rpc,
                { allowSwapperOffCurve: true },
              ));

        const message = MessageV0.compile({
          instructions,
          payerKey: new PublicKey(originAddress),
          recentBlockhash: '',
          addressLookupTableAccounts: lookupTables,
        });
        const txReqs = [
          new SolanaUnsignedTransaction(
            {
              transaction: new VersionedTransaction(message),
              signers: signers,
            },
            request.fromChain.network,
            request.fromChain.chain,
            'Execute Swap',
          ),
        ];

        if (isSignAndSendSigner(signer)) {
          const txids = await signer.signAndSend(txReqs);
          txs.push(
            ...txids.map((txid) => ({
              chain: request.fromChain.chain,
              txid,
            })),
          );
        } else if (isSignOnlySigner(signer)) {
          const signed = await signer.sign(txReqs);
          const txids = await SolanaPlatform.sendWait(
            request.fromChain.chain,
            rpc,
            signed,
          );
          txs.push(
            ...txids.map((txid) => ({
              chain: request.fromChain.chain,
              txid,
            })),
          );
        }
      } else if (request.fromChain.chain === 'Sui') {
        const tx = await (this.isTestnetRequest(request)
          ? createSwapFromSuiMoveCallsTestnet(
              this.normalizeQuoteForTestnet(quote.details!),
              originAddress,
              destinationAddress,
              this.referrerAddress(),
              undefined,
              rpc,
            )
          : createSwapFromSuiMoveCalls(
              quote.details!,
              originAddress,
              destinationAddress,
              this.referrerAddress(),
              undefined,
              rpc,
            ));

        const txReqs = [
          new SuiUnsignedTransaction(
            tx as Transaction,
            request.fromChain.network,
            request.fromChain.chain,
            'Execute Swap',
          ),
        ];

        if (isSignAndSendSigner(signer)) {
          const txids = await signer.signAndSend(txReqs);
          txs.push(
            ...txids.map((txid) => ({
              chain: request.fromChain.chain,
              txid,
            })),
          );
        } else if (isSignOnlySigner(signer)) {
          const signed = await signer.sign(txReqs);
          const txids = await SuiPlatform.sendWait(
            request.fromChain.chain,
            rpc,
            signed,
          );
          txs.push(
            ...txids.map((txid) => ({
              chain: request.fromChain.chain,
              txid,
            })),
          );
        }
      } else {
        const txReqs: EvmUnsignedTransaction<N, EvmChains>[] = [];
        const nativeChainId = nativeChainIds.networkChainToNativeChainId.get(
          request.fromChain.network,
          request.fromChain.chain,
        );

        if (!isNative(request.source.id.address)) {
          const tokenContract = EvmPlatform.getTokenImplementation(
            await request.fromChain.getRpc(),
            this.toMayanAddress(request.source.id),
          );

          const contractAddress = addresses.MAYAN_FORWARDER_CONTRACT;

          const allowance = await tokenContract.allowance(
            originAddress,
            contractAddress,
          );

          const amt = amount.units(quote.sourceToken.amount);
          if (allowance < amt) {
            const txReq = await tokenContract.approve.populateTransaction(
              // mayan contract address,
              contractAddress,
              amt,
            );
            txReqs.push(
              new EvmUnsignedTransaction(
                {
                  from: signer.address(),
                  chainId: nativeChainId as bigint,
                  ...txReq,
                },
                request.fromChain.network,
                request.fromChain.chain as EvmChains,
                'Approve Allowance',
              ),
            );
          }
        }

        const txReq = this.isTestnetRequest(request)
          ? getSwapFromEvmTxPayloadTestnet(
              this.normalizeQuoteForTestnet(quote.details!),
              originAddress,
              destinationAddress,
              this.referrerAddress(),
              originAddress,
              Number(nativeChainId!),
              undefined,
              undefined, // permit?
            )
          : getSwapFromEvmTxPayload(
              quote.details!,
              originAddress,
              destinationAddress,
              this.referrerAddress(),
              originAddress,
              Number(nativeChainId!),
              undefined,
              undefined, // permit?
            );

        txReqs.push(
          new EvmUnsignedTransaction(
            {
              from: signer.address(),
              chainId: nativeChainId,
              ...txReq,
            },
            request.fromChain.network,
            request.fromChain.chain as EvmChains,
            'Execute Swap',
          ),
        );

        if (isSignAndSendSigner(signer)) {
          const txids = await signer.signAndSend(txReqs);
          txs.push(
            ...txids.map((txid) => ({
              chain: request.fromChain.chain,
              txid,
            })),
          );
        } else if (isSignOnlySigner(signer)) {
          const signed = await signer.sign(txReqs);
          const txids = await EvmPlatform.sendWait(
            request.fromChain.chain,
            rpc,
            signed,
          );
          txs.push(
            ...txids.map((txid) => ({
              chain: request.fromChain.chain,
              txid,
            })),
          );
        }
      }

      return {
        from: request.fromChain.chain,
        to: request.toChain.chain,
        state: TransferState.SourceInitiated,
        originTxs: txs,
      } satisfies SourceInitiatedTransferReceipt;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  public override async *track(receipt: R, timeout?: number) {
    if (isCompleted(receipt) || isRedeemed(receipt) || isRefunded(receipt))
      return receipt;

    // What should be the default if no timeout is provided?
    let leftover = timeout ? timeout : 60 * 60 * 1000;
    while (leftover > 0) {
      const start = Date.now();

      if (
        // this is awkward but there is not hasSourceInitiated like fn in sdk (todo)
        isSourceInitiated(receipt) ||
        isSourceFinalized(receipt) ||
        isAttested(receipt)
      ) {
        const txstatus = await getTransactionStatus(
          this.wh.network,
          receipt.originTxs[receipt.originTxs.length - 1]!,
        );

        if (txstatus) {
          receipt = txStatusToReceipt(txstatus);
          yield { ...receipt, txstatus };

          if (
            isCompleted(receipt) ||
            isRedeemed(receipt) ||
            isRefunded(receipt)
          )
            return receipt;
        }
      } else {
        throw new Error('Transfer must have been initiated');
      }

      // sleep for 1 second so we dont spam the endpoint
      await new Promise((resolve) => setTimeout(resolve, 1000));
      leftover -= Date.now() - start;
    }

    return receipt;
  }

  override transferUrl(txid: string): string {
    return `https://explorer.mayan.finance/swap/${txid}`;
  }

  referrerAddress(): ReferrerAddresses | undefined {
    const { referrers } = this.constructor as ReferrerParams<N>;

    if (!referrers || Object.keys(referrers).length < 1) {
      return undefined;
    }

    return {
      solana: referrers.Solana || null,
      evm: referrers.Ethereum || null,
      sui: referrers.Sui || null,
    };
  }

  getReferralParameters(
    request: routes.RouteTransferRequest<N>,
  ): Pick<QuoteParams, 'referrerBps' | 'referrer'> {
    const { referrers, getReferrerBps } = this.constructor as ReferrerParams<N>;
    const isReferralEnabled =
      !!referrers?.Solana && typeof getReferrerBps === 'function';

    return isReferralEnabled
      ? {
          referrer: referrers.Solana,
          referrerBps: getReferrerBps(request),
        }
      : {};
  }
}
