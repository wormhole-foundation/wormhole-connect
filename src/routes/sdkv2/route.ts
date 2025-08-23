import type {
  Chain,
  ChainContext,
  Network,
  TokenId as TokenId,
  TransactionId,
  Signer,
} from '@wormhole-foundation/sdk';
import {
  Wormhole,
  routes,
  chainToPlatform,
  isSameToken,
  TransferState,
  circle,
} from '@wormhole-foundation/sdk';
import type { Token } from 'config/tokens';

import { amount as sdkAmount } from '@wormhole-foundation/sdk';
import { AsyncCache } from 'utils/AsyncCache';
import config, { getWormholeContextV2 } from 'config';
import { sleep } from 'utils';
import { isFrankensteinToken } from 'utils';
import { isNttToken } from 'utils/ntt';

type Amount = sdkAmount.Amount;

// =^o^=
export class SDKv2Route {
  // TODO: remove this
  IS_TOKEN_BRIDGE_ROUTE = false;

  constructor(readonly rc: routes.RouteConstructor) {
    this.IS_TOKEN_BRIDGE_ROUTE = [
      'ManualTokenBridge',
      'AutomaticTokenBridge',
      'TokenBridgeExecutorRoute',
    ].includes(rc.meta.name);
  }

  private tokenCache = new AsyncCache<TokenId[]>(24 * 60 * 60 * 1000); // 24 hour TTL

  get AUTOMATIC_DEPOSIT() {
    return this.rc.IS_AUTOMATIC;
  }

  get NATIVE_GAS_DROPOFF_SUPPORTED() {
    return this.rc.NATIVE_GAS_DROPOFF_SUPPORTED;
  }

  async getV2ChainContext<C extends Chain>(
    chain: C,
  ): Promise<{ chain: C; context: ChainContext<Network, C> }> {
    const wh = await getWormholeContextV2();
    const context = wh
      .getPlatform(chainToPlatform(chain))
      .getChain(chain) as ChainContext<Network, C>;
    return {
      chain,
      context,
    };
  }

  async isRouteSupported(
    name: string,
    sourceToken: Token,
    destToken: Token,
    fromChain: Chain,
    toChain: Chain,
  ): Promise<boolean> {
    const isSameChain = fromChain === toChain;

    if (
      isSameChain &&
      !this.rc.supportsSameChainSwaps?.(config.network, fromChain)
    ) {
      return false;
    }

    const fromContext = await this.getV2ChainContext(fromChain);
    const toContext = await this.getV2ChainContext(toChain);
    const supportedChains = this.rc.supportedChains(config.network);
    const fromChainSupported = supportedChains.includes(fromContext.chain);
    const toChainSupported = supportedChains.includes(toContext.chain);

    if (!fromChainSupported || !toChainSupported) {
      return false;
    }

    const isMayan = name.includes('Mayan');

    // Mayan can handle any input and output token that has liquidity on a DeX
    // No need to further check for destination tokens.
    if (isMayan) {
      return true;
    }

    try {
      const supportedDestinationTokens = await this.supportedDestTokens(
        name,
        sourceToken,
        fromChain,
        toChain,
      );

      return !!supportedDestinationTokens.find((tokenId) => {
        return isSameToken(tokenId, destToken);
      });
    } catch (e) {
      console.error('Error checking route support:', e);
      return false;
    }
  }

  isSupportedChain(chain: Chain): boolean {
    return this.rc.supportedChains(config.network).includes(chain);
  }

  async supportedDestTokens(
    routeName: string,
    sourceToken: Token | undefined,
    fromChain?: Chain | undefined,
    toChain?: Chain | undefined,
  ): Promise<TokenId[]> {
    if (!fromChain || !toChain || !sourceToken) return [];

    const fromContext = await this.getV2ChainContext(fromChain);
    const toContext = await this.getV2ChainContext(toChain);

    // TODO this is wrong... it should be filtering the output tokens...
    const isIlliquid = await this.isIlliquidDestToken(
      sourceToken,
      toContext.context,
    );

    if (isIlliquid) return [];

    // TODO remove once the mayan SDK has a special return value that represents infinite supported tokens
    const isMayan = routeName.includes('Mayan');
    const usdcAddr = circle.usdcContract.get(config.network, toChain);
    const isSameChain = fromChain === toChain;
    const cacheKey = `supportedDestTokens-${sourceToken.address}-${fromChain}-${toChain}`;
    const nativeToken = Wormhole.tokenId(toChain, 'native');
    const usdcToken = usdcAddr ? Wormhole.tokenId(toChain, usdcAddr) : null;
    // If we have Mayan available, which is a swap route, by default we show the gas token and USDC.
    const mayanTokens = usdcToken ? [nativeToken, usdcToken] : [nativeToken];

    const routeSupportedTokenFetcher = async () => {
      try {
        const tokens = await this.rc.supportedDestinationTokens(
          sourceToken.tokenId,
          fromContext.context,
          toContext.context,
        );

        return tokens;
      } catch {
        return [];
      }
    };

    const destTokens = isMayan
      ? mayanTokens
      : await this.tokenCache.requestWithCache(
          cacheKey,
          routeSupportedTokenFetcher,
        );

    const filteredTokens = destTokens.filter((t) => {
      const token = config.tokens.get(t);
      if (token && isFrankensteinToken(token, toContext.chain)) {
        return false;
      }

      if (isSameChain && token?.address === sourceToken.address) {
        return false;
      }

      return true;
    });

    return filteredTokens;
  }

  async getQuote(
    amount: Amount,
    sourceToken: Token,
    destToken: Token,
    sourceChain: Chain,
    destChain: Chain,
    options?: routes.AutomaticTokenBridgeRoute.Options,
    recipient?: string,
  ): Promise<
    [
      routes.Route<Network>,
      routes.QuoteResult<routes.Options>,
      routes.RouteTransferRequest<Network>,
    ]
  > {
    const req = await this.createRequest(
      sourceToken,
      destToken,
      sourceChain,
      destChain,
      recipient,
    );

    const wh = await getWormholeContextV2();
    const route = new this.rc(wh);
    const validationResult = await route.validate(req, {
      amount: sdkAmount.display(amount),
      options,
    });

    if (!validationResult.valid) {
      throw validationResult.error;
    }

    const quote = await route.quote(req, validationResult.params);

    return [route, quote, req];
  }

  async createRequest(
    sourceToken: Token,
    destToken: Token,
    sourceChain: Chain,
    destChain: Chain,
    recipient?: string,
  ): Promise<routes.RouteTransferRequest<Network>> {
    const sourceContext = (await this.getV2ChainContext(sourceChain)).context;
    const destContext = (await this.getV2ChainContext(destChain)).context;

    const wh = await getWormholeContextV2();
    const req = await routes.RouteTransferRequest.create(
      wh,
      /* @ts-ignore */
      {
        source: sourceToken.tokenId,
        destination: destToken.tokenId,
        recipient: recipient
          ? Wormhole.chainAddress(destChain, recipient)
          : undefined,
      },
      sourceContext,
      destContext,
    );
    return req;
  }

  async computeQuote(
    amountIn: Amount,
    sourceToken: Token,
    destToken: Token,
    fromChain: Chain,
    toChain: Chain,
    options?: routes.AutomaticTokenBridgeRoute.Options,
    recipient?: string,
  ): Promise<routes.QuoteResult<routes.Options>> {
    if (!fromChain || !toChain) {
      throw new Error('Need both chains to get a quote from SDKv2');
    }

    const [, quote] = await this.getQuote(
      amountIn,
      sourceToken,
      destToken,
      fromChain,
      toChain,
      options,
      recipient,
    );

    if (!quote.success) {
      throw quote.error;
    }

    return quote;
  }

  async send(
    sourceToken: Token,
    amount: Amount,
    fromChain: Chain,
    signer: Signer,
    toChain: Chain,
    recipientAddress: string,
    destToken: Token,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<[routes.Route<Network>, routes.Receipt]> {
    const [route, quote, req] = await this.getQuote(
      amount,
      sourceToken,
      destToken,
      fromChain,
      toChain,
      options,
      recipientAddress,
    );

    if (!quote.success) {
      throw quote.error;
    }

    let receipt = await route.initiate(
      req,
      signer,
      quote,
      Wormhole.chainAddress(toChain, recipientAddress),
    );

    // Don't call track if the transfer is already in a final state
    // since track can update the receipt to a different state
    if (
      receipt.state === TransferState.SourceInitiated ||
      receipt.state === TransferState.SourceFinalized
    ) {
      return [route, receipt];
    }

    // Otherwise track the transfer until it reaches a final state,
    // retrying up to 5 times if there are errors with exponential backoff
    let retries = 0;
    const maxRetries = 5;
    const baseDelay = 1000; // Initial delay of 1 second

    while (retries < maxRetries) {
      try {
        for await (receipt of route.track(receipt, 120 * 1000)) {
          if (receipt.state >= TransferState.SourceInitiated) {
            return [route, receipt];
          }
        }
      } catch (e) {
        console.error(
          `Error tracking transfer (attempt ${retries + 1} / ${maxRetries}):`,
          e,
        );
        const delay = baseDelay * Math.pow(2, retries); // Exponential backoff
        await sleep(delay);
        retries++;
      }
    }

    throw new Error('Never got a SourceInitiated state in receipt');
  }

  async resumeIfManual(tx: TransactionId): Promise<routes.Receipt | null> {
    const wh = await getWormholeContextV2();
    const route = new this.rc(wh);
    if (routes.isManual(route) || routes.isFinalizable(route)) {
      return route.resume(tx);
    } else {
      return null;
    }
  }

  // Prevent receiving illiquid wormhole-wrapped tokens
  // This is not a perfect solution or an exhaustive list of all illiquid tokens,
  // but it should cover the most common cases
  async isIlliquidDestToken(
    token: Token,
    toContext: ChainContext<Network, Chain>,
  ): Promise<boolean> {
    if (!this.IS_TOKEN_BRIDGE_ROUTE) return false;

    const { symbol, nativeChain } = token;

    // Exclude wormhole-wrapped tokens on the destination chain
    // if the NTT route is supported
    const isNttSupported = isNttToken(token);
    if (isNttSupported) {
      return true;
    }

    // These chains have a native bridge to/from Ethereum, so receiving wormhole-wrapped ETH is not necessary
    if (
      ['ETH', 'WETH'].includes(symbol) &&
      nativeChain === 'Ethereum' &&
      (['Scroll', 'Xlayer', 'Mantle', 'Unichain'] as Chain[]).includes(
        toContext.chain,
      )
    ) {
      return true;
    }

    return false;
  }
}
