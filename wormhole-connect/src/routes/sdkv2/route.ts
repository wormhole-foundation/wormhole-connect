import { Network, Wormhole, routes } from '@wormhole-foundation/sdk';
import {
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Route, TokenConfig } from 'config/types';
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

async function getWh(network: Network) {
  return await wormhole(network, [evm, solana, aptos, cosmwasm, sui, algorand]);
}

async function toRequest(
  network: Network,
  req: {
    srcToken: TokenId | string;
    srcChain: ChainName | ChainId;
    srcAddress: string;
    dstChain: ChainName | ChainId;
    dstAddress: string;
    dstToken: TokenId | string;
    options: {
      amount?: string;
    };
  },
): Promise<routes.RouteTransferRequest<Network>> {
  const wh = await getWh(network);

  const srcChain = config.sdkConverter.toChainV2(req.srcChain);
  const dstChain = config.sdkConverter.toChainV2(req.dstChain);

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

export class SDKV2Route extends RouteAbstract {
  NATIVE_GAS_DROPOFF_SUPPORTED = false;
  AUTOMATIC_DEPOSIT = false;
  TYPE: Route;

  network: Network;
  route?: routes.Route<Network>;

  constructor(network: Network, readonly rc: routes.RouteConstructor) {
    super();
    this.network = network;
    this.TYPE = Route.Bridge;
  }

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return false;
  }

  isSupportedChain(chain: ChainName): boolean {
    return false;
  }

  public isRouteAvailable(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    const req = toRequest(this.network, {
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

  public isSupportedSourceToken(
    token?: TokenConfig | undefined,
    destToken?: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId | undefined,
    destChain?: ChainName | ChainId | undefined,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  public isSupportedDestToken(
    token?: TokenConfig | undefined,
    sourceToken?: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId | undefined,
    destChain?: ChainName | ChainId | undefined,
  ): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  public supportedSourceTokens(
    tokens: TokenConfig[],
    destToken?: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId | undefined,
    destChain?: ChainName | ChainId | undefined,
  ): Promise<TokenConfig[]> {
    throw new Error('Method not implemented.');
  }
  public supportedDestTokens(
    tokens: TokenConfig[],
    sourceToken?: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId | undefined,
    destChain?: ChainName | ChainId | undefined,
  ): Promise<TokenConfig[]> {
    throw new Error('Method not implemented.');
  }
  public computeReceiveAmount(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: any,
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }
  public computeReceiveAmountWithFees(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: any,
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }
  public computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }
  public validate(
    token: TokenId | 'native',
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
    token: TokenId | 'native',
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
    throw new Error('Method not implemented.');
  }
  public getMaxSendAmount(): number {
    throw new Error('Method not implemented.');
  }
  public send(
    token: TokenId | 'native',
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
  public getPreview(
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
    token: TokenId,
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
