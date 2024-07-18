import {
  Chain,
  ChainContext,
  Network,
  Wormhole,
  routes,
  chainToPlatform,
  isSameToken,
  TokenId as TokenIdV2,
  TransferState,
} from '@wormhole-foundation/sdk';
import { ChainId, ChainName, TokenId as TokenIdV1 } from 'sdklegacy';
import { Route, TokenConfig } from 'config/types';
import {
  RelayerFee,
  TransferDestInfo,
  TransferDestInfoBaseParams,
  TransferDisplayData,
  TransferInfoBaseParams,
} from 'routes/types';
import { TokenPrices } from 'store/tokenPrices';
import { ParsedMessage } from 'utils/sdk';

import { SDKv2Signer } from './signer';

import {
  amount,
  SourceInitiatedTransferReceipt,
  SourceFinalizedTransferReceipt,
} from '@wormhole-foundation/sdk';
import config, { getWormholeContextV2 } from 'config';
import { calculateUSDPrice, getDisplayName, getWrappedToken } from 'utils';
import { toFixedDecimals } from 'utils/balance';
import { TransferWallet } from 'utils/wallet';

export class SDKv2Route {
  TYPE: Route;
  NATIVE_GAS_DROPOFF_SUPPORTED = false;
  AUTOMATIC_DEPOSIT = false;

  constructor(readonly rc: routes.RouteConstructor, routeType: Route) {
    this.TYPE = routeType;
    // TODO: get this info from the SDK
    if (routeType === Route.Relay) {
      this.NATIVE_GAS_DROPOFF_SUPPORTED = true;
      this.AUTOMATIC_DEPOSIT = true;
    }
  }

  async getV2ChainContext<C extends Chain>(
    chainV1: ChainName | ChainId,
  ): Promise<{ chain: C; context: ChainContext<Network, C> }> {
    const wh = await getWormholeContextV2();
    const chain = config.sdkConverter.toChainV2(chainV1) as C;
    const context = wh
      .getPlatform(chainToPlatform(chain))
      .getChain(chain) as ChainContext<Network, C>;
    return {
      chain,
      context,
    };
  }

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    _amount: string, // Amount is validated later, when getting a quote
    fromChainV1: ChainName | ChainId,
    toChainV1: ChainName | ChainId,
  ): Promise<boolean> {
    const fromChain = await this.getV2ChainContext(fromChainV1);
    const toChain = await this.getV2ChainContext(toChainV1);

    const supportedChains = this.rc.supportedChains(config.v2Network);

    const fromChainSupported = supportedChains.includes(fromChain.chain);
    const toChainSupported = supportedChains.includes(toChain.chain);

    const fromTokenIdV2 = await config.sdkConverter.getTokenIdV2ForKey(
      sourceToken,
      fromChainV1,
      config.tokens,
    );
    const toTokenIdV2 = await config.sdkConverter.getTokenIdV2ForKey(
      destToken,
      toChainV1,
      config.tokens,
    );

    if (!fromTokenIdV2 || !toTokenIdV2) return false;

    const fromTokenSupported = !!(
      await this.rc.supportedSourceTokens(fromChain.context)
    ).find((tokenId) => {
      return isSameToken(tokenId, fromTokenIdV2);
    });

    const toTokenSupported = !!(
      await this.rc.supportedDestinationTokens(
        fromTokenIdV2,
        fromChain.context,
        toChain.context,
      )
    ).find((tokenId) => {
      return isSameToken(tokenId, toTokenIdV2);
    });

    const isSupported =
      fromChainSupported &&
      toChainSupported &&
      fromTokenSupported &&
      toTokenSupported;

    /*
    if (!isSupported) {
      console.log(`isSupported false for ${this.rc.meta.name}:
        fromChain=${fromChain} ${fromChainSupported}
        toChain=${toChain} ${toChainSupported}
        fromToken=${sourceToken} ${fromTokenSupported}
        toToken=${destToken} ${toTokenSupported}
      `);
    }
    */

    return isSupported;
  }

  isSupportedChain(chainV1: ChainName): boolean {
    const chain = config.sdkConverter.toChainV2(chainV1);
    return this.rc.supportedChains(config.v2Network).includes(chain);
  }

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<boolean> {
    try {
      // The route should be available when no amount is set
      if (!amount) return true;
      const wh = await getWormholeContextV2();
      const route = new this.rc(wh);
      console.log(options);
      if (routes.isAutomatic(route)) {
        const req = await this.createRequest(
          amount,
          sourceToken,
          destToken,
          sourceChain,
          destChain,
        );
        const available = await route.isAvailable(req);
        if (!available) {
          return false;
        }
      }
      const [, quote] = await this.getQuote(
        amount,
        sourceToken,
        destToken,
        sourceChain,
        destChain,
        options,
      );
      if (!quote.success) {
        return false;
      }
    } catch (e) {
      console.error(e);
      // TODO is this the right place to try/catch these?
      // or deeper inside SDKv2Route?
      return false;
    }

    return true;
  }

  // NOTE this method ignores the given TokenConfig array
  async supportedSourceTokens(
    tokens: TokenConfig[],
    _destToken?: TokenConfig | undefined,
    fromChainV1?: ChainName | ChainId | undefined,
    _destChain?: ChainName | ChainId | undefined,
  ): Promise<TokenConfig[]> {
    if (!fromChainV1) return [];

    const fromChain = await this.getV2ChainContext(fromChainV1);
    return (await this.rc.supportedSourceTokens(fromChain.context))
      .map((t: TokenIdV2) => config.sdkConverter.findTokenConfigV1(t, tokens))
      .filter((tc) => tc != undefined) as TokenConfig[];
  }

  async supportedDestTokens(
    tokens: TokenConfig[],
    sourceToken: TokenConfig | undefined,
    fromChainV1?: ChainName | ChainId | undefined,
    toChainV1?: ChainName | ChainId | undefined,
  ): Promise<TokenConfig[]> {
    if (!fromChainV1 || !toChainV1 || !sourceToken) return [];

    const fromChain = await this.getV2ChainContext(fromChainV1);
    const toChain = await this.getV2ChainContext(toChainV1);
    const sourceTokenV2 = config.sdkConverter.toTokenIdV2(sourceToken);

    const destTokenIds = await this.rc.supportedDestinationTokens(
      sourceTokenV2,
      fromChain.context,
      toChain.context,
    );

    // TODO SDKV2 hack
    //
    // SDKv2 only returns token addresses, not metadata like names and logos.
    //
    // For custom tokens with no built-in foreign asset addresses, this means
    // we can't match the result of supportedDestinationTokens back up to a TokenConfig
    // to get its name and logo.
    //
    // Since token bridge only outputs the same token as you put in, we're just
    // returning sourceToken here as a hack so that we can maintain the name and logo.
    //
    // A longer term solution to this might be to add methods to SDKv2 for fetching token
    // metadata like name/logo and not relying on configuration for this at all. At that
    // point all that would be required would be an address.
    if (['bridge', 'relay', 'cosmosGateway'].includes(this.TYPE)) {
      if (destTokenIds.length > 0) {
        return [getWrappedToken(sourceToken)];
      }
    }

    return destTokenIds
      .map((t: TokenIdV2): TokenConfig | undefined =>
        config.sdkConverter.findTokenConfigV1(t, tokens),
      )
      .filter((tc) => tc != undefined) as TokenConfig[];
  }

  async getQuote(
    amount: string,
    sourceTokenV1: string,
    destTokenV1: string,
    sourceChainV1: ChainName | ChainId,
    destChainV1: ChainName | ChainId,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<
    [
      routes.Route<Network>,
      routes.QuoteResult<any>,
      routes.RouteTransferRequest<Network>,
    ]
  > {
    const req = await this.createRequest(
      amount,
      sourceTokenV1,
      destTokenV1,
      sourceChainV1,
      destChainV1,
    );
    const wh = await getWormholeContextV2();
    const route = new this.rc(wh);
    const validationResult = await route.validate(req, {
      amount,
      options,
    });

    if (!validationResult.valid) {
      throw validationResult.error;
    }

    const quote = await route.quote(req, validationResult.params);
    console.log('Got quote', quote);

    return [route, quote, req];
  }

  async createRequest(
    amount: string,
    sourceTokenV1: string,
    destTokenV1: string,
    sourceChainV1: ChainName | ChainId,
    destChainV1: ChainName | ChainId,
  ): Promise<routes.RouteTransferRequest<Network>> {
    const sourceTokenV2: TokenIdV2 | undefined =
      await config.sdkConverter.getTokenIdV2ForKey(
        sourceTokenV1,
        sourceChainV1,
        config.tokens,
      );

    const destTokenV2: TokenIdV2 | undefined =
      await config.sdkConverter.getTokenIdV2ForKey(
        destTokenV1,
        destChainV1,
        config.tokens,
      );

    if (sourceTokenV2 === undefined) {
      throw new Error(`Failed to find TokenId for ${sourceTokenV1}`);
    }
    if (destTokenV2 === undefined) {
      throw new Error(`Failed to find TokenId for ${destTokenV1}`);
    }

    const sourceChainV2 = (await this.getV2ChainContext(sourceChainV1)).context;
    const destChainV2 = (await this.getV2ChainContext(destChainV1)).context;

    const wh = await getWormholeContextV2();
    console.log(sourceTokenV2, destTokenV2, sourceChainV2, destChainV2);
    const req = await routes.RouteTransferRequest.create(
      wh,
      /* @ts-ignore */
      {
        source: sourceTokenV2,
        destination: destTokenV2,
      },
      sourceChainV2,
      destChainV2,
    );
    console.log(req);
    return req;
  }

  async computeReceiveAmount(
    amountIn: number,
    sourceToken: string,
    destToken: string,
    fromChainV1: ChainName | undefined,
    toChainV1: ChainName | undefined,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<number> {
    console.log(sourceToken, fromChainV1, destToken, toChainV1);

    if (isNaN(amountIn)) {
      return 0;
    }

    if (!fromChainV1 || !toChainV1)
      throw new Error('Need both chains to get a quote from SDKv2');

    const [, quote] = await this.getQuote(
      amountIn.toString(),
      sourceToken,
      destToken,
      fromChainV1,
      toChainV1,
      options,
    );

    if (quote.success) {
      return amount.whole(quote.destinationToken.amount);
    } else {
      throw quote.error;
    }
  }

  async computeReceiveAmountWithFees(
    amount: number,
    sourceToken: string,
    destToken: string,
    fromChainV1: ChainName | undefined,
    toChainV1: ChainName | undefined,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<number> {
    if (!fromChainV1 || !toChainV1)
      throw new Error('Need both chains to get a quote from SDKv2');

    // TODO handle fees?
    return this.computeReceiveAmount(
      amount,
      sourceToken,
      destToken,
      fromChainV1,
      toChainV1,
      options,
    );
  }

  async computeQuote(
    amountIn: number,
    sourceToken: string,
    destToken: string,
    fromChainV1: ChainName | undefined,
    toChainV1: ChainName | undefined,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<routes.QuoteResult<any>> {
    console.log(sourceToken, fromChainV1, destToken, toChainV1);

    if (!fromChainV1 || !toChainV1)
      throw new Error('Need both chains to get a quote from SDKv2');

    const [, quote] = await this.getQuote(
      amountIn.toString(),
      sourceToken,
      destToken,
      fromChainV1,
      toChainV1,
      options,
    );

    if (!quote.success) {
      throw quote.error;
    }

    return quote;
  }

  // Unused method, don't bother implementing
  // TODO Get rid of this
  public computeSendAmount(
    receiveAmount: number | undefined,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }

  public validate(
    token: TokenIdV1 | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  public getMinSendAmount(
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): number {
    return 0;
  }

  public getMaxSendAmount(): number {
    return Infinity;
  }

  async send(
    sourceToken: TokenConfig,
    amount: string,
    fromChainV1: ChainName | ChainId,
    senderAddress: string,
    toChainV1: ChainName | ChainId,
    recipientAddress: string,
    destToken: string,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<
    [
      routes.Route<Network>,
      SourceInitiatedTransferReceipt | SourceFinalizedTransferReceipt<any>,
    ]
  > {
    const [route, quote, req] = await this.getQuote(
      amount.toString(),
      sourceToken.key,
      destToken,
      fromChainV1,
      toChainV1,
      options,
    );

    if (!quote.success) {
      throw quote.error;
    }

    const signer = await SDKv2Signer.fromChainV1(
      fromChainV1,
      senderAddress,
      options,
      TransferWallet.SENDING,
    );

    console.log(signer);

    let receipt = await route.initiate(
      req,
      signer,
      quote,
      Wormhole.chainAddress(
        config.sdkConverter.toChainV2(toChainV1),
        recipientAddress,
      ),
    );

    // Wait for transfer to finish =^o^=
    for await (receipt of route.track(receipt, 120 * 1000)) {
      console.log('Current Transfer State: ', TransferState[receipt.state]);
      if (
        receipt.state == TransferState.SourceInitiated ||
        receipt.state == TransferState.SourceFinalized
      ) {
        return [route, receipt];
      }
    }

    throw new Error('Never got a SourceInitiate state in receipt');
  }

  public async redeem(
    destChain: ChainName | ChainId,
    messageInfo: any,
    recipient: string,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async getPreview(
    token: TokenConfig,
    destToken: TokenConfig,
    amount: number,
    sendingChain: ChainName | ChainId,
    recipientChain: ChainName | ChainId,
    sendingGasEst: string,
    claimingGasEst: string,
    receiveAmount: string,
    tokenPrices: TokenPrices,
    relayerFee?: number,
    receiveNativeAmt?: number,
  ): Promise<TransferDisplayData> {
    const displayData = [
      this.createDisplayItem('Amount', amount, destToken, tokenPrices),
    ];

    if (relayerFee) {
      displayData.push(
        this.createDisplayItem('Relayer fee', relayerFee, token, tokenPrices),
      );
    }

    if (receiveNativeAmt) {
      const destChainName = config.wh.toChainName(recipientChain);
      const destGasToken =
        config.tokens[config.chains[destChainName]?.gasToken || ''];
      displayData.push(
        this.createDisplayItem(
          'Native gas on destination',
          Number(toFixedDecimals(receiveNativeAmt.toString(), 6)),
          destGasToken,
          tokenPrices,
        ),
      );
    }

    return displayData;
  }

  createDisplayItem(
    title: string,
    amount: number,
    token: TokenConfig,
    tokenPrices: TokenPrices,
  ) {
    return {
      title,
      value: `${!isNaN(amount) ? amount : '0'} ${getDisplayName(token)}`,
      valueUSD: calculateUSDPrice(amount, tokenPrices, token),
    };
  }

  async getTransferSourceInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData> {
    const txData = params.txData as ParsedMessage;
    const token = config.tokens[txData.tokenKey];
    const displayData = [
      this.createDisplayItem(
        'Amount',
        Number(txData.amount),
        token,
        params.tokenPrices,
      ),
    ];
    const relayerFee = Number.parseFloat(txData.relayerFee || '0');
    if (relayerFee > 0) {
      displayData.push(
        this.createDisplayItem(
          'Relayer fee',
          relayerFee,
          token,
          params.tokenPrices,
        ),
      );
    }
    return displayData;
  }

  async getTransferDestInfo<T extends TransferDestInfoBaseParams>(
    params: T,
  ): Promise<TransferDestInfo> {
    const info: TransferDestInfo = {
      route: this.TYPE,
      displayData: [],
    };
    const txData = params.txData as ParsedMessage;
    const token = config.tokens[txData.tokenKey];
    if (txData.receiveAmount) {
      info.displayData.push(
        this.createDisplayItem(
          'Amount',
          Number(txData.receiveAmount),
          token,
          params.tokenPrices,
        ),
      );
    }
    if (txData.receiveNativeAmount && txData.receiveNativeAmount > 0) {
      info.displayData.push(
        this.createDisplayItem(
          'Native gas amount',
          Number(txData.receiveNativeAmount.toFixed(6)),
          config.tokens[config.chains[txData.toChain]?.gasToken || ''],
          params.tokenPrices,
        ),
      );
    }
    return info;
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
    amount: string,
  ): Promise<RelayerFee | null> {
    const [, quote] = await this.getQuote(
      amount,
      token,
      destToken,
      sourceChain,
      destChain,
    );
    if (!quote.success) {
      throw quote.error;
    }
    if (!quote.relayFee) {
      return null;
    }
    const { token: feeTokenV2, amount: feeAmount } = quote.relayFee;
    const feeToken = config.sdkConverter.toTokenIdV1(feeTokenV2);
    if (!feeToken) throw new Error('Failed to convert fee token');
    const relayerFee = {
      feeToken,
      fee: BigInt(feeAmount.amount),
    };
    return relayerFee;
  }

  async getForeignAsset(
    token: TokenIdV1,
    chain: ChainName | ChainId,
    destToken?: TokenConfig | undefined,
  ): Promise<string | null> {
    return 'test';
  }

  tryFetchRedeemTx(txData: ParsedMessage): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
