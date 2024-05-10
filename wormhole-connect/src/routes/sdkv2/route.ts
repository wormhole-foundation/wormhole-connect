import {
  Chain,
  Network,
  Wormhole,
  routes,
  chainToPlatform,
  isSameToken,
  TokenId as TokenIdV2,
} from '@wormhole-foundation/sdk';
import {
  ChainId,
  ChainName,
  TokenId as TokenIdV1,
} from '@wormhole-foundation/wormhole-connect-sdk';
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

import { wormhole } from '@wormhole-foundation/sdk';
import evm from '@wormhole-foundation/sdk/evm';
import solana from '@wormhole-foundation/sdk/solana';
import aptos from '@wormhole-foundation/sdk/aptos';
import sui from '@wormhole-foundation/sdk/sui';
import cosmwasm from '@wormhole-foundation/sdk/cosmwasm';
import algorand from '@wormhole-foundation/sdk/algorand';
import config from 'config';
import { getSdkConverter } from 'config';
import { SDKConverter } from 'config/converter';

async function toRequest(
  network: Network,
  converter: SDKConverter,
  req: {
    srcToken: TokenIdV1 | string;
    srcChain: ChainName | ChainId;
    srcAddress: string;
    dstChain: ChainName | ChainId;
    dstAddress: string;
    dstToken: TokenIdV1 | string;
    options: {
      amount?: string;
    };
  },
): Promise<routes.RouteTransferRequest<Network>> {
  const wh = await this.getV2WormholeClient();

  const srcChain = converter.toChainV2(req.srcChain);
  const dstChain = converter.toChainV2(req.dstChain);

  const from = Wormhole.chainAddress(srcChain, req.srcAddress);
  const to = Wormhole.chainAddress(dstChain, req.dstAddress);

  const srcToken = Wormhole.tokenId(
    srcChain,
    typeof req.srcToken === 'string' ? req.srcToken : req.srcToken.address,
  );

  const dstToken = Wormhole.tokenId(
    dstChain,
    typeof req.dstToken === 'string' ? req.dstToken : req.dstToken.address,
  );

  return routes.RouteTransferRequest.create(wh, {
    from,
    to,
    source: srcToken,
    destination: dstToken,
  });
}

export class SDKv2Route<N extends Network> extends RouteAbstract {
  TYPE: Route;
  NATIVE_GAS_DROPOFF_SUPPORTED = false;
  AUTOMATIC_DEPOSIT = false;

  network: N;
  converter: SDKConverter;
  route?: routes.Route<Network>;

  _whV2?: Wormhole<N>;

  constructor(
    network: NetworkV1,
    readonly rc: routes.RouteConstructor,
    routeType: Route,
  ) {
    super();
    this.converter = getSdkConverter(network);
    this.network = this.converter.toNetworkV2(network) as N;
    this.TYPE = routeType;
  }

  async getV2WormholeClient(): Promise<Wormhole<N>> {
    if (this._whV2) return this._whV2;
    this._whV2 = await wormhole(this.network, [
      evm,
      solana,
      aptos,
      cosmwasm,
      sui,
      algorand,
    ]);
    return this._whV2;
  }

  async getV2ChainContext(chainV1: ChainName | ChainId) {
    console.log('-');
    const wh = await this.getV2WormholeClient();
    console.log('--');
    const chain: Chain = this.converter.toChainV2(chainV1);
    console.log('---');
    const context = wh.getPlatform(chainToPlatform(chain)).getChain(chain);
    console.log('----');
    return {
      chain,
      context,
    };
  }

  // Connect's old interface just accepts basic strings for tokens, eg 'WETH'.
  // We need to identifying which token address this is actually referring to
  // on the given chain by checking 'foreignAssets' key in token configs
  getTokenIdV2(
    symbol: string,
    chain: ChainName | ChainId,
  ): TokenIdV2 | undefined {
    const tc = config.tokens[symbol];
    const chainName = config.wh.toChainName(chain);
    if (tc.nativeChain === chainName) {
      return this.converter.toTokenIdV2(tc);
    } else {
      /* @ts-ignore */
      const fa = tc.foreignAssets[chainName];
      if (fa) {
        /* @ts-ignore */
        const foreignAddr = tc.foreignAssets[chain].address;
        return this.converter.tokenIdV2(chainName, foreignAddr);
      } else {
        return undefined;
      }
    }
  }

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    _amount: string, // Amount is validated later, when getting a quote
    fromChainV1: ChainName | ChainId,
    toChainV1: ChainName | ChainId,
  ): Promise<boolean> {
    console.log(0);
    const fromChain = await this.getV2ChainContext(fromChainV1);
    const toChain = await this.getV2ChainContext(toChainV1);
    console.log(1);

    const supportedChains = this.rc.supportedChains(this.network);
    console.log(2);

    const fromChainSupported = supportedChains.includes(fromChain.chain);
    const toChainSupported = supportedChains.includes(toChain.chain);
    console.log(3);

    const fromTokenIdV2 = this.getTokenIdV2(sourceToken, fromChainV1);
    const toTokenIdV2 = this.getTokenIdV2(destToken, toChainV1);

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
    const chain = this.converter.toChainV2(chainV1);
    return this.rc.supportedChains(this.network).includes(chain);
  }

  async isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    const req = toRequest(this.network, this.converter, {
      srcToken: sourceToken,
      srcChain: sourceChain,
      srcAddress: '',
      dstChain: destChain,
      dstAddress: '',
      dstToken: destToken,
      options: {
        amount,
      },
    });

    console.log(req);

    throw new Error('Method not implemented.');
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
    const tokenV2 = this.converter.toTokenIdV2(sourceToken);

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
    const destTokenV2 = this.converter.toTokenIdV2(destToken);
    const sourceTokenV2 = this.converter.toTokenIdV2(sourceToken);

    return !!(
      await this.rc.supportedDestinationTokens(
        sourceTokenV2,
        fromChain.context,
        toChain.context,
      )
    ).find((tokenId) => {
      return isSameToken(tokenId, destTokenV2);
    });
  }
  async supportedSourceTokens(
    tokens: TokenConfig[],
    destToken?: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId | undefined,
    destChain?: ChainName | ChainId | undefined,
  ): Promise<TokenConfig[]> {
    throw new Error('Method not implemented.');
  }
  async supportedDestTokens(
    tokens: TokenConfig[],
    sourceToken?: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId | undefined,
    destChain?: ChainName | ChainId | undefined,
  ): Promise<TokenConfig[]> {
    throw new Error('Method not implemented.');
  }
  async computeReceiveAmount(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: any,
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async computeReceiveAmountWithFees(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: any,
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async validate(
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
  async estimateSendGas(
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
  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage | undefined,
  ): Promise<BigNumber> {
    throw new Error('Method not implemented.');
  }
  getMinSendAmount(routeOptions: any): number {
    throw new Error('Method not implemented.');
  }
  getMaxSendAmount(): number {
    throw new Error('Method not implemented.');
  }
  async send(
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
  async redeem(
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
    throw new Error('Method not implemented.');
  }
  async getTransferSourceInfo<T extends TransferInfoBaseParams>(
    params: T,
  ): Promise<TransferDisplayData> {
    throw new Error('Method not implemented.');
  }
  async getTransferDestInfo<T extends TransferDestInfoBaseParams>(
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
