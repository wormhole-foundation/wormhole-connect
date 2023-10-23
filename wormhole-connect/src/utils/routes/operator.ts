import {
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';

import { CHAINS, ROUTES, TOKENS } from 'config';
import { TokenConfig, Route } from 'config/types';
import { BridgeRoute } from './bridge';
import { RelayRoute } from './relay';
// import { HashflowRoute } from './hashflow';
import { CCTPRelayRoute } from './cctpRelay';
import { CosmosGatewayRoute } from './cosmosGateway';
import { ParsedMessage, PayloadType, getMessage, isEvmChain, wh } from '../sdk';
import { isCosmWasmChain } from '../cosmos';
import RouteAbstract from './routeAbstract';
import {
  UnsignedMessage,
  SignedMessage,
  TransferDisplayData,
  TransferInfoBaseParams,
} from './types';
import {
  CCTPManualRoute,
  CCTP_LOG_TokenMessenger_DepositForBurn,
} from './cctpManual';
import { TBTCRoute } from './tbtc';

export class Operator {
  getRoute(route: Route): RouteAbstract {
    switch (route) {
      case Route.Bridge: {
        return new BridgeRoute();
      }
      case Route.Relay: {
        return new RelayRoute();
      }
      case Route.CCTPManual: {
        return new CCTPManualRoute();
      }
      case Route.CCTPRelay: {
        return new CCTPRelayRoute();
      }
      // case Route.Hashflow: {
      //   return new HashflowRoute();
      // }
      case Route.CosmosGateway: {
        return new CosmosGatewayRoute();
      }
      case Route.TBTC: {
        return new TBTCRoute();
      }
      default: {
        throw new Error(`${route} is not a valid route`);
      }
    }
  }

  async getRouteFromTx(txHash: string, chain: ChainName): Promise<Route> {
    if (isCosmWasmChain(chain)) {
      return Route.CosmosGateway;
    }

    // Check if is CCTP Route (CCTPRelay or CCTPManual)
    if (isEvmChain(chain)) {
      const provider = wh.mustGetProvider(chain);
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) throw new Error(`No receipt for ${txHash} on ${chain}`);
      const cctpDepositForBurnLog = receipt.logs.find(
        (log) => log.topics[0] === CCTP_LOG_TokenMessenger_DepositForBurn,
      );
      if (cctpDepositForBurnLog) {
        if (
          cctpDepositForBurnLog.topics[3].substring(26).toLowerCase() ===
          wh
            .getContracts(chain)
            ?.cctpContracts?.wormholeCCTP?.substring(2)
            .toLowerCase()
        )
          return Route.CCTPRelay;
        else return Route.CCTPManual;
      }
    }

    let message = await getMessage(txHash, chain);

    if (message.toChain === 'sei') {
      return Route.Relay;
    }

    if (
      isCosmWasmChain(message.fromChain) ||
      isCosmWasmChain(message.toChain)
    ) {
      return Route.CosmosGateway;
    }

    return (message as ParsedMessage).payloadID === PayloadType.Automatic
      ? Route.Relay
      : Route.Bridge;
  }

  async isRouteAvailable(
    route: Route,
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (!ROUTES.includes(route)) {
      return false;
    }

    const r = this.getRoute(route);
    return await r.isRouteAvailable(
      sourceToken,
      destToken,
      amount,
      sourceChain,
      destChain,
    );
  }

  allSupportedChains(): ChainName[] {
    const supported = new Set<ChainName>();
    for (const key in CHAINS) {
      const chainName = key as ChainName;
      for (const route of ROUTES) {
        if (!supported.has(chainName)) {
          const isSupported = this.isSupportedChain(route as Route, chainName);
          if (isSupported) {
            supported.add(chainName);
          }
        }
      }
    }
    return Array.from(supported);
  }

  async allSupportedSourceTokens(
    destToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<TokenConfig[]> {
    const supported: { [key: string]: TokenConfig } = {};
    for (const route of ROUTES) {
      for (const key in TOKENS) {
        const alreadySupported = supported[key];
        if (!alreadySupported) {
          const isSupported = await this.isSupportedSourceToken(
            route as Route,
            TOKENS[key],
            destToken,
            sourceChain,
            destChain,
          );
          if (isSupported) {
            supported[key] = TOKENS[key];
          }
        }
      }
    }
    return Object.values(supported);
  }

  async allSupportedDestTokens(
    sourceToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<TokenConfig[]> {
    const supported: { [key: string]: TokenConfig } = {};
    for (const route of ROUTES) {
      for (const key in TOKENS) {
        const alreadySupported = supported[key];
        if (!alreadySupported) {
          const isSupported = await this.isSupportedDestToken(
            route as Route,
            TOKENS[key],
            sourceToken,
            sourceChain,
            destChain,
          );
          if (isSupported) {
            supported[key] = TOKENS[key];
          }
        }
      }
    }
    return Object.values(supported);
  }

  isSupportedChain(route: Route, chain: ChainName): boolean {
    const r = this.getRoute(route);
    return r.isSupportedChain(chain);
  }

  async isSupportedSourceToken(
    route: Route,
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!ROUTES.includes(route)) {
      return false;
    }

    const r = this.getRoute(route);
    return await r.isSupportedSourceToken(
      token,
      destToken,
      sourceChain,
      destChain,
    );
  }

  async isSupportedDestToken(
    route: Route,
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!ROUTES.includes(route)) {
      return false;
    }

    const r = this.getRoute(route);
    return await r.isSupportedDestToken(
      token,
      sourceToken,
      sourceChain,
      destChain,
    );
  }

  async supportedSourceTokens(
    route: Route,
    tokens: TokenConfig[],
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<TokenConfig[]> {
    if (!ROUTES.includes(route)) {
      return [];
    }

    const r = this.getRoute(route);
    return await r.supportedSourceTokens(
      tokens,
      destToken,
      sourceChain,
      destChain,
    );
  }

  async supportedDestTokens(
    route: Route,
    tokens: TokenConfig[],
    sourceToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<TokenConfig[]> {
    if (!ROUTES.includes(route)) {
      return [];
    }

    const r = this.getRoute(route);
    return await r.supportedDestTokens(
      tokens,
      sourceToken,
      sourceChain,
      destChain,
    );
  }

  async computeReceiveAmount(
    route: Route,
    sendAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeReceiveAmount(sendAmount, routeOptions);
  }
  async computeSendAmount(
    route: Route,
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeSendAmount(receiveAmount, routeOptions);
  }

  async validate(
    route: Route,
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return await r.validate(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      routeOptions,
    );
  }

  async estimateSendGas(
    route: Route,
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<BigNumber> {
    const r = this.getRoute(route);
    return await r.estimateSendGas(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      routeOptions,
    );
  }

  async estimateClaimGas(
    route: Route,
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    if (!signedMessage)
      throw new Error('Cannot estimate gas without a signed message');
    const r = this.getRoute(route);
    return await r.estimateClaimGas(destChain, signedMessage);
  }

  async send(
    route: Route,
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<string> {
    const r = this.getRoute(route);
    return await r.send(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      routeOptions,
    );
  }

  async redeem(
    route: Route,
    destChain: ChainName | ChainId,
    signed: SignedMessage,
    payer: string,
  ): Promise<string> {
    const r = this.getRoute(route);
    return await r.redeem(destChain, signed, payer);
  }

  async getPreview(
    route: Route,
    token: TokenConfig,
    destToken: TokenConfig,
    amount: number,
    sendingChain: ChainName | ChainId,
    receipientChain: ChainName | ChainId,
    sendingGasEst: string,
    claimingGasEst: string,
    routeOptions?: any,
  ): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return await r.getPreview(
      token,
      destToken,
      amount,
      sendingChain,
      receipientChain,
      sendingGasEst,
      claimingGasEst,
      routeOptions,
    );
  }

  async getRelayerFee(
    route: Route,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
  ): Promise<BigNumber> {
    const r = this.getRoute(route);
    return r.getRelayerFee(sourceChain, destChain, token);
  }

  async getForeignAsset(
    route: Route,
    tokenId: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const r = this.getRoute(route);
    return r.getForeignAsset(tokenId, chain);
  }

  async isTransferCompleted(
    route: Route,
    destChain: ChainName | ChainId,
    message: SignedMessage,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return r.isTransferCompleted(destChain, message);
  }

  async getMessage(
    route: Route,
    tx: string,
    chain: ChainName | ChainId,
    unsigned?: boolean,
  ): Promise<UnsignedMessage> {
    const r = this.getRoute(route);
    return r.getMessage(tx, chain);
  }

  async getSignedMessage(
    route: Route,
    message: UnsignedMessage,
  ): Promise<SignedMessage> {
    const r = this.getRoute(route);
    return r.getSignedMessage(message);
  }

  getTransferSourceInfo<T extends TransferInfoBaseParams>(
    route: Route,
    params: T,
  ): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return r.getTransferSourceInfo(params);
  }

  getTransferDestInfo<T extends TransferInfoBaseParams>(
    route: Route,
    params: T,
  ): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return r.getTransferDestInfo(params);
  }

  // swap information (native gas slider)
  nativeTokenAmount(
    route: Route,
    destChain: ChainName | ChainId,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber> {
    const r = this.getRoute(route);
    return r.nativeTokenAmount(destChain, token, amount, walletAddress);
  }

  maxSwapAmount(
    route: Route,
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    const r = this.getRoute(route);
    return r.maxSwapAmount(destChain, token, walletAddress);
  }

  tryFetchRedeemTx(
    route: Route,
    txData: UnsignedMessage,
  ): Promise<string | undefined> {
    const r = this.getRoute(route);
    return r.tryFetchRedeemTx(txData);
  }
}

const RouteOperator = new Operator();
export default RouteOperator;
