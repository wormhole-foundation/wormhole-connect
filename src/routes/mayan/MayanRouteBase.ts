import type {
  ComposableSuiMoveCallsOptions,
  Quote as MayanQuote,
  QuoteOptions,
  QuoteParams,
} from '@mayanfinance/swap-sdk';
import {
  createSwapFromSolanaInstructions,
  createSwapFromSuiMoveCalls,
  generateFetchQuoteUrl,
  getSwapFromEvmTxPayload,
} from '@mayanfinance/swap-sdk';
import type { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import type { Connection, TransactionInstruction } from '@solana/web3.js';
import {
  MessageV0,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  createSwapFromSolanaInstructions as createSwapFromSolanaInstructionsTestnet,
  createSwapFromSuiMoveCalls as createSwapFromSuiMoveCallsTestnet,
  generateFetchQuoteUrl as generateFetchQuoteUrlTestnet,
  getSwapFromEvmTxPayload as getSwapFromEvmTxPayloadTestnet,
} from '@testnet-mayan/swap-sdk';
import { circle } from '@wormhole-foundation/sdk-base';
import type {
  Chain,
  ChainAddress,
  ChainContext,
  Network,
  Signer,
  SourceInitiatedTransferReceipt,
  TokenId,
  TransactionId,
} from '@wormhole-foundation/sdk-connect';
import {
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
} from '@wormhole-foundation/sdk-connect';
import type { EvmChains } from '@wormhole-foundation/sdk-evm';
import {
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
import { createTransactionRequest, getEvmContractAddress } from './evm/utils';
import { getAllTokenIdsForChain } from '../../utils/tokenHelpers';
import {
  getNativeContractAddress,
  getTransactionStatus,
  isTestnetSupportedChain,
  supportedChains,
  toMayanChainName,
  txStatusToReceipt,
} from './utils';
import {
  MayanProtocol,
  type Options,
  type Quote,
  type QuoteResult,
  type Receipt,
  type ReferrerParams,
  type TransferParams,
  type ValidatedParams,
  type ValidationResult,
} from './types';
import {
  isHyperCoreChain,
  maybeGetHyperCorePermitSignature,
  validateHyperCoreTransfer,
} from 'utils/hypercore';

export class MayanRouteBase<N extends Network> extends routes.AutomaticRoute<
  N,
  Options,
  ValidatedParams,
  Receipt
> {
  MAX_SLIPPAGE = 1;

  static NATIVE_GAS_DROPOFF_SUPPORTED = false;
  static override IS_AUTOMATIC = true;

  protocols: MayanProtocol[] = [
    MayanProtocol.WH,
    MayanProtocol.MCTP,
    MayanProtocol.FAST_MCTP,
    MayanProtocol.SWIFT,
    MayanProtocol.MONO_CHAIN,
  ];

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
    const { hyperCoreParams: _hyperCoreParams, ...testnetCompatibleQuote } =
      quote;
    return testnetCompatibleQuote;
  }

  getDefaultOptions(): Options {
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

  static isProtocolSupported<N extends Network>(
    chain: ChainContext<N>,
  ): boolean {
    return supportedChains(chain.network).includes(chain.chain);
  }

  // Mayan can handle any input and output token that has liquidity on a DeX
  static async supportedDestinationTokens<N extends Network>(
    _token: TokenId,
    _fromChain: ChainContext<N>,
    toChain: ChainContext<N>,
  ): Promise<TokenId[]> {
    // For HyperCore, only allow USDC as destination token
    if (isHyperCoreChain(toChain.chain)) {
      const usdc = Wormhole.tokenId(toChain.chain, 'native');
      return usdc ? [usdc] : [];
    }

    const tokens = getAllTokenIdsForChain(toChain.chain);

    return tokens;
  }

  async isAvailable(): Promise<boolean> {
    // No way to check relayer availability so assume true
    return true;
  }

  async validate(
    request: routes.RouteTransferRequest<N>,
    params: TransferParams,
  ): Promise<ValidationResult> {
    try {
      const hyperCoreValidation = validateHyperCoreTransfer(request, params);
      if (hyperCoreValidation) {
        return hyperCoreValidation;
      }

      params.options = params.options ?? this.getDefaultOptions();

      return {
        valid: true,
        params: {
          ...params,
          normalizedParams: {
            slippageBps: params.options.slippageBps,
          },
        },
      } as ValidationResult;
    } catch (e) {
      return { valid: false, params, error: e as Error };
    }
  }

  protected toMayanAddress(tokenId: TokenId): string {
    return isNative(tokenId.address)
      ? getNativeContractAddress(tokenId.chain)
      : canonicalAddress(tokenId);
  }

  getFeeInBaseUnits(
    request: routes.RouteTransferRequest<N>,
    amountString: string,
  ) {
    const { getReferrerBps } = this.constructor as ReferrerParams<N>;

    const referrerBps = getReferrerBps ? getReferrerBps(request) : null;

    if (!referrerBps) {
      return 0n;
    }

    const amt = amount.parse(amountString, request.source.decimals);
    const MAX_U16 = 65_535n;
    const dBps = BigInt(10 * referrerBps);

    if (dBps > MAX_U16) {
      throw new Error('bps exceeds max u16');
    }

    const fee = amount.getDeciBps(amt, dBps);
    const feeUnits = amount.units(fee);

    return feeUnits;
  }

  getQuoteAmountIn64(
    request: routes.RouteTransferRequest<N>,
    amountString: string,
  ) {
    const decimals = request.source.decimals;
    const amt = amount.parse(amountString, decimals);
    const feeUnits = this.getFeeInBaseUnits(request, amountString);

    if (feeUnits <= 0n) {
      return amt.amount;
    }

    const amtUnits = amount.units(amt);
    const remainingUnits = amtUnits - feeUnits;
    const remaining = amount.fromBaseUnits(remainingUnits, decimals);

    return remaining.amount;
  }

  async injectReferralInstructionsForSolana(
    connection: Connection,
    request: routes.RouteTransferRequest<N>,
    instructionsFromMayanSwap: TransactionInstruction[],
    sender: PublicKey,
    originalAmount: string,
  ) {
    const { fromChain, source } = request;
    const referrerAddress = this.referrerAddress().solana;
    const referralFee = this.getFeeInBaseUnits(request, originalAmount);

    if (!referrerAddress || !referralFee || fromChain.network !== 'Mainnet') {
      return instructionsFromMayanSwap;
    }

    const instructions: TransactionInstruction[] = [];
    const referrer = new PublicKey(referrerAddress);
    const isSol = isNative(source.id.address);

    if (isSol) {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: sender,
          toPubkey: referrer,
          lamports: referralFee,
        }),
      );
    } else {
      const mint = new PublicKey(source.id.address.toString());

      const tokenProgramId = await SolanaPlatform.getTokenProgramId(
        connection,
        mint,
      );

      const referrerAta = getAssociatedTokenAddressSync(
        mint,
        referrer,
        true,
        tokenProgramId,
      );

      const senderAta = getAssociatedTokenAddressSync(
        mint,
        sender,
        true,
        tokenProgramId,
      );

      const referrerAtaAccount = await connection.getAccountInfo(referrerAta);

      if (!referrerAtaAccount) {
        instructions.push(
          createAssociatedTokenAccountIdempotentInstruction(
            sender,
            referrerAta,
            referrer,
            mint,
            tokenProgramId,
          ),
        );
      }

      instructions.push(
        createTransferCheckedInstruction(
          senderAta,
          mint,
          referrerAta,
          sender,
          referralFee,
          source.decimals,
          undefined,
          tokenProgramId,
        ),
      );
    }

    instructions.push(...instructionsFromMayanSwap);

    return instructions;
  }

  async injectReferralInstructionsForSui(
    provider: SuiClient,
    request: routes.RouteTransferRequest<N>,
    sender: string,
    originalAmount: string,
  ) {
    const { fromChain, source } = request;
    const referrerAddress = this.referrerAddress().sui;
    const referralFee = this.getFeeInBaseUnits(request, originalAmount);

    if (!referrerAddress || !referralFee || fromChain.network !== 'Mainnet') {
      return {};
    }

    const remainingAmount = this.getQuoteAmountIn64(request, originalAmount);
    const tx = new Transaction();
    const token = source.id.address;
    const isSui = isNative(token);
    let primaryCoinObjectId;

    if (isSui) {
      primaryCoinObjectId = tx.gas;
    } else {
      const coinType = token.toString();

      const [primaryCoin, ...mergeCoins] = await SuiPlatform.getCoins(
        provider,
        sender,
        coinType,
      );

      if (!primaryCoin) {
        throw new Error(`No coins of type ${coinType} found for ${sender}.`);
      }

      primaryCoinObjectId = tx.object(primaryCoin.coinObjectId);

      if (mergeCoins.length > 0) {
        tx.mergeCoins(
          primaryCoinObjectId,
          mergeCoins.map((coin) => tx.object(coin.coinObjectId)),
        );
      }
    }

    const [referralFeeCoin, remainingAmountCoin] = tx.splitCoins(
      primaryCoinObjectId,
      [referralFee, remainingAmount],
    );

    tx.transferObjects([referralFeeCoin], referrerAddress);

    return { tx, remainingAmountCoin };
  }

  protected async fetchQuote(
    request: routes.RouteTransferRequest<N>,
    params: ValidatedParams,
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
      amountIn64: this.getQuoteAmountIn64(request, params.amount),
      fromToken: this.toMayanAddress(request.source.id),
      toToken: this.toMayanAddress(request.destination.id),
      /* @ts-ignore */
      fromChain: toMayanChainName(fromChain.network, fromChain.chain),
      /* @ts-ignore */
      toChain: toMayanChainName(toChain.network, toChain.chain),
      ...this.getDefaultOptions(),
      ...params.options,
      slippageBps: 'auto',
    };

    const quoteOpts: QuoteOptions = {
      swift: this.protocols.includes(MayanProtocol.SWIFT),
      mctp: this.protocols.includes(MayanProtocol.MCTP),
      fastMctp: this.protocols.includes(MayanProtocol.FAST_MCTP),
      monoChain: this.protocols.includes(MayanProtocol.MONO_CHAIN),
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
      throw new Error(`Unable to fetch quote ${{ cause: res }}`);
    }

    const quotes = res.data?.quotes?.filter((quote: MayanQuote) =>
      this.protocols.includes(quote.type as MayanProtocol),
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

  getMinAmount(minAmountIn: string | number, decimals: number) {
    try {
      const minAmount = amount.parse(
        amount.denoise(minAmountIn, decimals),
        decimals,
      );
      return minAmount;
    } catch {
      return null;
    }
  }

  async quote(
    request: routes.RouteTransferRequest<N>,
    params: ValidatedParams,
  ): Promise<QuoteResult> {
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

      const fullQuote: Quote = {
        success: true,
        params,
        sourceToken: {
          token: request.source.id,
          amount: amount.fromBaseUnits(
            BigInt(quote.effectiveAmountIn64),
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
          const minAmount = this.getMinAmount(
            minAmountIn,
            request.source.decimals,
          );

          if (minAmount) {
            return {
              success: false,
              error: new routes.MinAmountError(minAmount),
            };
          }
        }

        if (data?.msg) {
          return {
            success: false,
            error: Error(`${data?.msg} ${{ cause: data }}`),
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
    quote: Quote,
    to: ChainAddress,
  ) {
    try {
      const originAddress = signer.address();
      const destinationAddress = canonicalAddress(to);
      const txs: TransactionId[] = [];
      const rpc = await request.fromChain.getRpc();
      const feeUnits = this.getFeeInBaseUnits(request, quote.params.amount);
      const usdcPermitSignature = await maybeGetHyperCorePermitSignature(
        request,
        signer,
        quote,
        destinationAddress,
      );

      if (request.fromChain.chain === 'Solana') {
        // Uncomment and use this when we want to support HyperCore USDC deposits on SOL
        // const solanaOptions = {
        //   allowSwapperOffCurve: true,
        //   ...(usdcPermitSignature ? { usdcPermitSignature } : {}),
        // };

        const { instructions, signers, lookupTables } =
          await (this.isTestnetRequest(request)
            ? createSwapFromSolanaInstructionsTestnet(
                this.normalizeQuoteForTestnet(quote.details!),
                originAddress,
                destinationAddress,
                null,
                rpc,
                { allowSwapperOffCurve: true },
              )
            : createSwapFromSolanaInstructions(
                quote.details!,
                originAddress,
                destinationAddress,
                null,
                rpc,
                { allowSwapperOffCurve: true },
              ));

        const payerKey = new PublicKey(originAddress);

        const message = MessageV0.compile({
          instructions: await this.injectReferralInstructionsForSolana(
            rpc,
            request,
            instructions,
            payerKey,
            quote.params.amount,
          ),
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
        const { tx: builtTransaction, remainingAmountCoin } =
          await this.injectReferralInstructionsForSui(
            rpc,
            request,
            originAddress,
            quote.params.amount,
          );

        const options: ComposableSuiMoveCallsOptions | undefined =
          builtTransaction
            ? {
                builtTransaction,
                inputCoin: { result: remainingAmountCoin },
              }
            : undefined;

        const tx = await (this.isTestnetRequest(request)
          ? createSwapFromSuiMoveCallsTestnet(
              this.normalizeQuoteForTestnet(quote.details!),
              originAddress,
              destinationAddress,
              null,
              undefined,
              rpc,
            )
          : createSwapFromSuiMoveCalls(
              quote.details!,
              originAddress,
              destinationAddress,
              null,
              undefined,
              rpc,
              options,
            ));

        const txReqs = [
          new SuiUnsignedTransaction(
            tx,
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

        const referrerAddress = this.referrerAddress();
        const tokenAddress = this.toMayanAddress(request.source.id);
        const isNativeToken = isNative(request.source.id.address);

        const contractAddress = getEvmContractAddress(
          request.fromChain.network,
          feeUnits,
          referrerAddress.evm,
        );

        const amountUnits = amount.units(
          amount.parse(quote.params.amount, request.source.decimals),
        );

        if (!isNativeToken) {
          const tokenContract = EvmPlatform.getTokenImplementation(
            rpc,
            tokenAddress,
          );

          const allowance = await tokenContract.allowance(
            originAddress,
            contractAddress,
          );

          if (allowance < amountUnits) {
            const txReq = await tokenContract.approve.populateTransaction(
              contractAddress,
              amountUnits,
            );

            txReqs.push(
              new EvmUnsignedTransaction(
                {
                  from: originAddress,
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

        const quoteDetails = quote.details;

        if (!quoteDetails) {
          throw new Error('Missing Mayan quote details');
        }

        const mainnetOptions =
          usdcPermitSignature !== undefined
            ? { usdcPermitSignature }
            : undefined;

        const mayanTxRequest = this.isTestnetRequest(request)
          ? getSwapFromEvmTxPayloadTestnet(
              this.normalizeQuoteForTestnet(quoteDetails),
              originAddress,
              destinationAddress,
              null,
              originAddress,
              Number(nativeChainId!),
              undefined,
              undefined,
            )
          : getSwapFromEvmTxPayload(
              quoteDetails,
              originAddress,
              destinationAddress,
              null,
              originAddress,
              Number(nativeChainId!),
              undefined,
              undefined,
              mainnetOptions,
            );

        const txReq = createTransactionRequest(
          request.fromChain.network,
          mayanTxRequest,
          amountUnits,
          feeUnits,
          originAddress,
          tokenAddress,
          isNativeToken,
          referrerAddress.evm,
        );

        txReqs.push(
          new EvmUnsignedTransaction(
            txReq,
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

  public override async *track(receipt: Receipt, timeout?: number) {
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

  referrerAddress() {
    const { referrers } = this.constructor as ReferrerParams<N>;

    return {
      solana: referrers?.Solana,
      evm: referrers?.Ethereum,
      sui: referrers?.Sui,
    };
  }
}
