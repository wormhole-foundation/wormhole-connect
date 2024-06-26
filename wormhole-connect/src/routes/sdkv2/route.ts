import {
  Chain,
  ChainContext,
  Network,
  Wormhole,
  routes,
  chainToPlatform,
  isSameToken,
  TokenId as TokenIdV2,
} from '@wormhole-foundation/sdk';
import { ChainId, ChainName, TokenId as TokenIdV1 } from 'sdklegacy';
import { Route, TokenConfig, Network as NetworkV1 } from 'config/types';
import { BigNumber } from 'ethers';
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

import { wormhole, amount } from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import aptos from '@wormhole-foundation/sdk/aptos';
import sui from '@wormhole-foundation/sdk/sui';
import cosmwasm from '@wormhole-foundation/sdk/cosmwasm';
import algorand from '@wormhole-foundation/sdk/algorand';
import config from 'config';

export class SDKv2Route<N extends Network> extends RouteAbstract {
  TYPE: Route;
  NATIVE_GAS_DROPOFF_SUPPORTED = false;
  AUTOMATIC_DEPOSIT = false;

  network: N;
  route?: routes.Route<Network>;

  constructor(
    network: NetworkV1,
    readonly rc: routes.RouteConstructor,
    routeType: Route,
  ) {
    super();
    this.network = config.sdkConverter.toNetworkV2(network) as N;
    this.TYPE = routeType;
  }

  async getWh(network: N): Promise<Wormhole<N>> {
    // TODO cache
    return await wormhole(network, [
      evm,
      solana,
      aptos,
      cosmwasm,
      sui,
      algorand,
    ]);
  }

  async toRequest<FC extends Chain, TC extends Chain>(
    wh: Wormhole<N>,
    req: {
      srcChain: ChainName | ChainId;
      srcToken: string;
      dstChain: ChainName | ChainId;
      dstToken: string;
    },
  ): Promise<routes.RouteTransferRequest<N>> {
    const srcChain = (await this.getV2ChainContext(req.srcChain)).context;
    const dstChain = (await this.getV2ChainContext(req.dstChain)).context;

    const srcTokenV2: TokenIdV2<FC> | undefined =
      config.sdkConverter.getTokenIdV2ForKey(
        req.srcToken,
        req.srcChain,
        config.tokens,
      );
    const dstTokenV2: TokenIdV2<TC> | undefined =
      config.sdkConverter.getTokenIdV2ForKey(
        req.dstToken,
        req.dstChain,
        config.tokens,
      );

    if (srcTokenV2 === undefined) {
      throw new Error(`Failed to find TokenId for ${req.srcToken}`);
    }
    if (dstTokenV2 === undefined) {
      throw new Error(`Failed to find TokenId for ${req.dstToken}`);
    }

    return routes.RouteTransferRequest.create(
      wh,
      /* @ts-ignore */
      {
        source: srcTokenV2,
        destination: dstTokenV2,
      },
      srcChain,
      dstChain,
    );
  }

  async getV2ChainContext<C extends Chain>(
    chainV1: ChainName | ChainId,
  ): Promise<{ chain: C; context: ChainContext<N, C> }> {
    const wh = await this.getWh(this.network);
    const chain = config.sdkConverter.toChainV2(chainV1) as C;
    const context = wh
      .getPlatform(chainToPlatform(chain))
      .getChain(chain) as ChainContext<N, C>;
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

    const supportedChains = this.rc.supportedChains(this.network);

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
    return this.rc.supportedChains(this.network).includes(chain);
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

  async computeReceiveAmount(
    amountIn: number,
    sourceToken: string,
    destToken: string,
    fromChainV1: ChainName | undefined,
    toChainV1: ChainName | undefined,
    options: any,
  ): Promise<number> {
    if (!fromChainV1 || !toChainV1)
      throw new Error('source and destination chains are required');

    console.log('getting quote', this);
    console.trace();

    const wh = await this.getWh(this.network);

    const req = await this.toRequest(wh, {
      srcToken: sourceToken,
      srcChain: fromChainV1,
      dstChain: toChainV1,
      dstToken: destToken,
    });

    console.log(req);

    const route = new this.rc(wh, req);

    const validationResult = await route.validate({
      amount: amountIn.toString(),
    });

    console.log(validationResult);

    if (!validationResult.valid) {
      throw validationResult.error;
    }

    const quote = await route.quote(validationResult.params);

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

  public estimateSendGas(
    token: TokenIdV1 | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions?: any,
  ): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }

  public estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage | undefined,
  ): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }

  public getMinSendAmount(routeOptions: any): number {
    return 0;
  }

  public getMaxSendAmount(): number {
    return Infinity;
  }

  public send(
    token: TokenIdV1 | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    destToken: string,
    routeOptions: any,
  ): Promise<any> {
    throw new Error('Method not implemented.');
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

  getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
  ): Promise<RelayerFee | null> {
    throw new Error('Method not implemented.');
  }

  getForeignAsset(
    token: TokenIdV1,
    chain: ChainName | ChainId,
    destToken?: TokenConfig | undefined,
  ): Promise<string | null> {
    throw new Error('Method not implemented.');
  }

  getMessage(tx: string, chain: ChainName | ChainId): Promise<UnsignedMessage> {
    throw new Error('Method not implemented.');
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
