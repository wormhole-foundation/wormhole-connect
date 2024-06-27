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
import { RouteAbstract } from 'routes/abstracts';
import {
  RelayerFee,
  SignedMessage,
  TransferDestInfo,
  TransferDestInfoBaseParams,
  TransferDisplayData,
  TransferInfoBaseParams,
  UnsignedMessage,
} from 'routes/types';
import { TokenPrices } from 'store/tokenPrices';
import { ParsedMessage, ParsedRelayerMessage } from 'utils/sdk';

import { SDKv2Signer } from './signer';

import {
  amount,
  SourceInitiatedTransferReceipt,
  SourceFinalizedTransferReceipt,
} from '@wormhole-foundation/sdk';
import config, { getWormholeContextV2 } from 'config';

export class SDKv2Route extends RouteAbstract {
  TYPE: Route;
  NATIVE_GAS_DROPOFF_SUPPORTED = false;
  AUTOMATIC_DEPOSIT = false;

  constructor(
    readonly rc: routes.RouteConstructor,
    routeType: Route,
  ) {
    super();
    this.TYPE = routeType;
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

    // Connect's old interface just accepts basic strings for tokens, eg 'WETH'.
    // We need to identifying which token address this is actually referring to
    // on the given chain by checking 'foreignAssets' key in token configs
    const getTokenIdV2 = (
      symbol: string,
      chain: ChainName | ChainId,
    ): TokenIdV2 | undefined => {
      const tc = config.tokens[symbol];
      const chainName = config.wh.toChainName(chain);
      if (tc.nativeChain === chainName) {
        return config.sdkConverter.toTokenIdV2(tc);
      } else {
        /* @ts-ignore */
        const fa = tc.foreignAssets[chainName];
        if (fa) {
          /* @ts-ignore */
          const foreignAddr = tc.foreignAssets[chain].address;
          return config.sdkConverter.tokenIdV2(chainName, foreignAddr);
        } else {
          return undefined;
        }
      }
    };

    const fromTokenIdV2 = getTokenIdV2(sourceToken, fromChainV1);
    const toTokenIdV2 = getTokenIdV2(destToken, toChainV1);

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
  ): Promise<boolean> {
    // TODO
    return true;
  }

  async isSupportedSourceToken(
    sourceToken?: TokenConfig | undefined,
    _destToken?: TokenConfig | undefined,
    fromChainV1?: ChainName | ChainId | undefined,
    _destChain?: ChainName | ChainId | undefined,
  ): Promise<boolean> {
    if (!fromChainV1) return false;
    if (!sourceToken) return false;

    const fromChain = await this.getV2ChainContext(fromChainV1);
    const tokenV2 = config.sdkConverter.toTokenIdV2(sourceToken);

    return !!(await this.rc.supportedSourceTokens(fromChain.context)).find(
      (tokenId) => {
        return isSameToken(tokenId, tokenV2);
      },
    );
  }

  async isSupportedDestToken(
    sourceToken?: TokenConfig | undefined,
    destToken?: TokenConfig | undefined,
    fromChainV1?: ChainName | ChainId | undefined,
    toChainV1?: ChainName | ChainId | undefined,
  ): Promise<boolean> {
    if (!fromChainV1) return false;
    if (!toChainV1) return false;
    if (!sourceToken) return false;
    if (!destToken) return false;

    const fromChain = await this.getV2ChainContext(fromChainV1);
    const toChain = await this.getV2ChainContext(toChainV1);
    const destTokenV2 = config.sdkConverter.toTokenIdV2(destToken);
    const sourceTokenV2 = config.sdkConverter.toTokenIdV2(sourceToken);

    try {
      return !!(
        await this.rc.supportedDestinationTokens(
          sourceTokenV2,
          fromChain.context,
          toChain.context,
        )
      ).find((tokenId) => {
        return isSameToken(tokenId, destTokenV2);
      });
    } catch (e) {
      return false;
    }
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

    return (
      await this.rc.supportedDestinationTokens(
        sourceTokenV2,
        fromChain.context,
        toChain.context,
      )
    )
      .map((t: TokenIdV2) => config.sdkConverter.findTokenConfigV1(t, tokens))
      .filter((tc) => tc != undefined) as TokenConfig[];
  }

  private async getQuote<FC extends Chain, TC extends Chain>(
    amount: string,
    sourceToken: TokenIdV2<FC>,
    destToken: TokenIdV2<TC>,
    sourceChain: ChainContext<Network, FC>,
    destChain: ChainContext<Network, TC>,
    options: any,
  ): Promise<[routes.Route<Network>, routes.QuoteResult<any>]> {
    const wh = await getWormholeContextV2();
    const req = await routes.RouteTransferRequest.create(
      wh,
      /* @ts-ignore */
      {
        source: sourceToken,
        destination: destToken,
      },
      sourceChain,
      destChain,
    );

    const route = new this.rc(wh, req);

    const validationResult = await route.validate({
      amount,
      options,
    });

    if (!validationResult.valid) {
      throw validationResult.error;
    }

    return [route, await route.quote(validationResult.params)];
  }

  async computeReceiveAmount(
    amountIn: number,
    sourceToken: string,
    destToken: string,
    fromChainV1: ChainName | undefined,
    toChainV1: ChainName | undefined,
    options: any,
  ): Promise<number> {
    if (isNaN(amountIn)) {
      return 0;
    }

    if (!fromChainV1 || !toChainV1)
      throw new Error('Need both chains to get a quote from SDKv2');

    const srcTokenV2: TokenIdV2 | undefined =
      config.sdkConverter.getTokenIdV2ForKey(
        sourceToken,
        fromChainV1,
        config.tokens,
      );

    const dstTokenV2: TokenIdV2 | undefined =
      config.sdkConverter.getTokenIdV2ForKey(
        destToken,
        toChainV1,
        config.tokens,
      );

    if (srcTokenV2 === undefined) {
      throw new Error(`Failed to find TokenId for ${sourceToken}`);
    }
    if (dstTokenV2 === undefined) {
      throw new Error(`Failed to find TokenId for ${destToken}`);
    }

    const srcChain = (await this.getV2ChainContext(fromChainV1)).context;
    const dstChain = (await this.getV2ChainContext(toChainV1)).context;

    const [_route, quote] = await this.getQuote(
      amountIn.toString(),
      srcTokenV2,
      dstTokenV2,
      srcChain,
      dstChain,
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
    routeOptions: any,
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
      routeOptions,
    );
  }

  // Unused method, don't bother implementing
  // TODO Get rid of this
  public computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: any,
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
    routeOptions: any,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  public getMinSendAmount(routeOptions: any): number {
    return 0;
  }

  public getMaxSendAmount(): number {
    return Infinity;
  }

  async send(
    sourceToken: TokenIdV1 | 'native',
    amount: string,
    fromChainV1: ChainName | ChainId,
    senderAddress: string,
    toChainV1: ChainName | ChainId,
    recipientAddress: string,
    destToken: string,
    options: any,
  ): Promise<
    SourceInitiatedTransferReceipt | SourceFinalizedTransferReceipt<any>
  > {
    const fromChainV2 = await this.getV2ChainContext(fromChainV1);
    const toChainV2 = await this.getV2ChainContext(toChainV1);

    const sourceTokenV2 =
      sourceToken === 'native'
        ? Wormhole.tokenId(config.sdkConverter.toChainV2(fromChainV1), 'native')
        : config.sdkConverter.toTokenIdV2(sourceToken);

    const destTokenV2 = config.sdkConverter.getTokenIdV2ForKey(
      destToken,
      toChainV1,
      config.tokens,
    );

    if (!destTokenV2) throw new Error(`Couldn't find destToken`);

    const [route, quote] = await this.getQuote(
      amount.toString(),
      sourceTokenV2,
      destTokenV2,
      fromChainV2.context,
      toChainV2.context,
      options,
    );

    if (!quote.success) {
      throw quote.error;
    }

    const signer = await SDKv2Signer.fromChainV1(
      fromChainV1,
      senderAddress,
      options,
    );

    let receipt = await route.initiate(
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
        return receipt;
      }
    }

    throw new Error('Never got a SourceInitiate state in receipt');
  }

  public redeem(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
    recipient: string,
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async getPreview(
    token: TokenConfig,
    destToken: TokenConfig,
    amount: number,
    sendingChain: ChainName | ChainId,
    receipientChain: ChainName | ChainId,
    sendingGasEst: string,
    claimingGasEst: string,
    receiveAmount: string,
    tokenPrices: TokenPrices,
    routeOptions?: any,
  ): Promise<TransferDisplayData> {
    return [
      {
        title: 'test',
        value: 'testvalue',
        valueUSD: '23',
      },
    ];
  }

  public getTransferSourceInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData> {
    throw new Error('Method not implemented.');
  }

  public getTransferDestInfo<T extends TransferDestInfoBaseParams>(
    params: T,
  ): Promise<TransferDestInfo> {
    throw new Error('Method not implemented.');
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
  ): Promise<RelayerFee | null> {
    return null;
  }

  async getForeignAsset(
    token: TokenIdV1,
    chain: ChainName | ChainId,
    destToken?: TokenConfig | undefined,
  ): Promise<string | null> {
    return 'test';
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedMessage> {
    /*
    let { context } = await this.getV2ChainContext(chain);
    switch (this.TYPE) {
      case 'bridge':
      case 'relay':
        let vaa = (await context.getProtocol('TokenBridge')


    }

    let vaas = await (await context.getProtocol('WormholeCore')).parseMessages(tx);
    console.log(vaas);
    debugger;
    */
    throw new Error('Method not implemented');
  }

  getSignedMessage(message: UnsignedMessage): Promise<SignedMessage> {
    throw new Error('Method not implemented.');
  }

  isTransferCompleted(
    destChain: ChainName | ChainId,
    messageInfo: SignedMessage,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  tryFetchRedeemTx(
    txData: ParsedMessage | ParsedRelayerMessage,
  ): Promise<string | undefined> {
    throw new Error('Method not implemented.');
  }
}
