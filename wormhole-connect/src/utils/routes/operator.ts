import {
  ChainId,
  ChainName,
  TokenId,
  NO_VAA_FOUND,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import { Route } from 'store/transferInput';
import { TokenConfig } from 'config/types';
import { BridgeRoute } from './bridge';
import { RelayRoute } from './relay';
import { HashflowRoute } from './hashflow';
import { CCTPRelayRoute } from './cctpRelay';
import { CosmosGatewayRoute } from './cosmosGateway';
import { ParsedMessage, PayloadType, getMessage, wh } from '../sdk';
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
  CCTPManual_CHAINS as CCTPChains,
} from './cctpManual';

// TODO: need to make this configurable
export const listOfRoutes = [
  Route.BRIDGE,
  /*
  Route.CCTPManual,
  Route.CCTPRelay,*/
  Route.RELAY,
  Route.COSMOS_GATEWAY,
];
export default class Operator {
  getRoute(route: Route): RouteAbstract {
    switch (route) {
      case Route.BRIDGE: {
        return new BridgeRoute();
      }
      case Route.RELAY: {
        return new RelayRoute();
      }
      case Route.CCTPManual: {
        return new CCTPManualRoute();
      }
      case Route.CCTPRelay: {
        return new CCTPRelayRoute();
      }
      case Route.HASHFLOW: {
        return new HashflowRoute();
      }
      case Route.COSMOS_GATEWAY: {
        return new CosmosGatewayRoute();
      }
      default: {
        throw new Error(`${route} is not a valid route`);
      }
    }
  }

  async getRouteFromTx(txHash: string, chain: ChainName): Promise<Route> {
    if (isCosmWasmChain(chain)) {
      return Route.COSMOS_GATEWAY;
    }

    let message: UnsignedMessage | undefined;
    let error;
    try {
      message = await getMessage(txHash, chain);
    } catch (_error: any) {
      error = _error.message;
    }

    // if(HASHFLOW_CONTRACT_ADDRESSES.includes(vaa.emitterAddress)) {
    //   return Route.HASHFLOW
    // }

    if (!message) {
      // Currently, CCTP manual is the only route without a VAA
      if (error === NO_VAA_FOUND) {
        const provider = wh.mustGetProvider(chain);
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) throw new Error(`No receipt for ${txHash} on ${chain}`);
        if (
          receipt.logs.find(
            (log) => log.topics[0] === CCTP_LOG_TokenMessenger_DepositForBurn,
          )
        )
          return Route.CCTPManual;
      }
      throw error;
    }

    const CCTP_CONTRACT_ADDRESSES = CCTPChains.map((chainName) => {
      try {
        return wh.getContracts(chainName as ChainName)?.cctpContracts
          ?.wormholeCCTP;
      } catch (e) {
        return '0x0';
      }
    });

    if (
      CCTP_CONTRACT_ADDRESSES.includes(
        '0x' + message.emitterAddress?.substring(24),
      )
    ) {
      return Route.CCTPRelay;
    }

    if (message.toChain === 'sei') {
      return Route.RELAY;
    }

    if (
      isCosmWasmChain(message.fromChain) ||
      isCosmWasmChain(message.toChain)
    ) {
      return Route.COSMOS_GATEWAY;
    }

    return (message as ParsedMessage).payloadID === PayloadType.AUTOMATIC
      ? Route.RELAY
      : Route.BRIDGE;
  }

  async isRouteAvailable(
    route: Route,
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return await r.isRouteAvailable(
      sourceToken,
      destToken,
      amount,
      sourceChain,
      destChain,
    );
  }

  async isSupportedSourceToken(
    route: Route,
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
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
  ): Promise<string> {
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
  ): Promise<string> {
    const r = this.getRoute(route);
    return await r.estimateClaimGas(destChain);
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

  public async getNativeBalance(
    route: Route,
    address: string,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const r = this.getRoute(route);
    return r.getNativeBalance(address, network);
  }

  public async getTokenBalance(
    route: Route,
    address: string,
    tokenId: TokenId,
    network: ChainName | ChainId,
  ): Promise<BigNumber | null> {
    const r = this.getRoute(route);
    return r.getTokenBalance(address, tokenId, network);
  }

  public async getRelayerFee(
    route: Route,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
  ): Promise<BigNumber> {
    const r = this.getRoute(route);
    return r.getRelayerFee(sourceChain, destChain, token);
  }

  public async getForeignAsset(
    route: Route,
    tokenId: TokenId,
    network: ChainName | ChainId,
  ): Promise<string | null> {
    const r = this.getRoute(route);
    return r.getForeignAsset(tokenId, network);
  }

  public async isTransferCompleted(
    route: Route,
    destChain: ChainName | ChainId,
    message: SignedMessage,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return r.isTransferCompleted(destChain, message);
  }

  public async getMessage(
    route: Route,
    tx: string,
    network: ChainName | ChainId,
    unsigned?: boolean,
  ): Promise<UnsignedMessage> {
    const r = this.getRoute(route);
    return r.getMessage(tx, network);
  }

  public async getSignedMessage(
    route: Route,
    message: UnsignedMessage,
    unsigned?: boolean,
  ): Promise<SignedMessage> {
    const r = this.getRoute(route);
    return r.getSignedMessage(message);
  }

  public getTransferSourceInfo<T extends TransferInfoBaseParams>(
    route: Route,
    params: T,
  ): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return r.getTransferSourceInfo(params);
  }

  public getTransferDestInfo<T extends TransferInfoBaseParams>(
    route: Route,
    params: T,
  ): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return r.getTransferDestInfo(params);
  }

  // swap information (native gas slider)
  public nativeTokenAmount(
    route: Route,
    destChain: ChainName | ChainId,
    token: TokenId,
    amount: BigNumber,
    walletAddress: string,
  ): Promise<BigNumber> {
    const r = this.getRoute(route);
    return r.nativeTokenAmount(destChain, token, amount, walletAddress);
  }

  public maxSwapAmount(
    route: Route,
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    const r = this.getRoute(route);
    return r.maxSwapAmount(destChain, token, walletAddress);
  }
}
