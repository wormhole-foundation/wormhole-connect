/*import { PublicKey } from '@solana/web3.js';*/
import { ChainId, ChainName, TokenId } from 'sdklegacy';
import { ParsedMessage } from 'utils/sdk';

import config from 'config';
import { TokenConfig, Route } from 'config/types';
import {
  TransferDisplayData,
  TransferInfoBaseParams,
  TransferDestInfo,
} from './types';
import { TokenPrices } from 'store/tokenPrices';

import {
  Chain,
  Network,
  routes,
  SourceInitiatedTransferReceipt,
  TransferState,
} from '@wormhole-foundation/sdk';

import { getRoute } from './mappings';
import axios from 'axios';
import SDKv2Route from './sdkv2';
import { RelayerFee } from 'store/relay';

export interface TxInfo {
  route: Route;
  tokenChain: Chain;
  tokenAddress: string;
  amount: string;
  receipt: SourceInitiatedTransferReceipt;
}

export class Operator {
  getRoute(route: Route): SDKv2Route {
    return getRoute(route);
  }

  async getRouteFromTx(txHash: string, chain: Chain): Promise<TxInfo> {
    const url = `https://api.${
      config.isMainnet ? '' : 'testnet.'
    }wormholescan.io/api/v1/operations?page=0&pageSize=1&sortOrder=DESC&txHash=${txHash}`;

    interface Operations {
      operations: Operation[];
    }

    interface Operation {
      id: string;
      emitterChain: number;
      emitterAddress: {
        hex: string;
        native: string;
      };
      sequence: string;
      //vaa: {
      //  raw: string;
      //  guardianSetIndex: number;
      //  isDuplicated: boolean;
      //};
      content: {
        //payload: {
        //  amount: string;
        //  fee: string;
        //  fromAddress: null;
        //  parsedPayload: null;
        //  payload: string;
        //  payloadType: number;
        //  toAddress: string;
        //  toChain: number;
        //  tokenAddress: string;
        //  tokenChain: number;
        //};
        standarizedProperties: {
          appIds: string[];
          fromChain: number;
          fromAddress: string;
          toChain: number;
          toAddress: string;
          tokenChain: number;
          tokenAddress: string;
          amount: string;
          feeAddress: string;
          feeChain: number;
          fee: string;
        };
      };
      sourceChain: {
        chainId: number;
        timestamp: string;
        transaction: {
          txHash: string;
        };
        from: string;
        status: string;
      };
      data: {
        symbol: string;
        tokenAmount: string;
        usdAmount: string;
      };
    }

    //https://github.com/XLabs/wormscan-ui/blob/b96ad4c44d367cbf7c7e1c39d655e9fda3e0c3d9/src/consts.ts#L173-L185
    //export const UNKNOWN_APP_ID = 'UNKNOWN';
    //export const CCTP_APP_ID = 'CCTP_WORMHOLE_INTEGRATION';
    //export const CCTP_MANUAL_APP_ID = 'CCTP_MANUAL';
    const CONNECT_APP_ID = 'CONNECT';
    //export const GATEWAY_APP_ID = 'WORMCHAIN_GATEWAY_TRANSFER';
    const PORTAL_APP_ID = 'PORTAL_TOKEN_BRIDGE';
    //export const PORTAL_NFT_APP_ID = 'PORTAL_NFT_BRIDGE';
    //export const ETH_BRIDGE_APP_ID = 'ETH_BRIDGE';
    //export const USDT_TRANSFER_APP_ID = 'USDT_TRANSFER';
    //export const NTT_APP_ID = 'NATIVE_TOKEN_TRANSFER';
    //export const GR_APP_ID = 'GENERIC_RELAYER';
    //export const MAYAN_APP_ID = 'MAYAN';
    //export const TBTC_APP_ID = 'TBTC';

    const { data } = await axios.get<Operations>(url);
    if (data.operations.length === 0)
      throw new Error('No route found for txHash');
    const operation = data.operations[0];
    const { appIds, tokenChain, tokenAddress, toChain, amount, fromChain } =
      operation.content.standarizedProperties;
    if (config.sdkConverter.toChainV2(fromChain as ChainId) !== chain) {
      // TODO: wormholescan can return transactions from other chains
      // with the same txHash
      throw new Error('Chain mismatch');
    }
    const details = {
      tokenChain: config.sdkConverter.toChainV2(tokenChain as ChainId),
      tokenAddress, // TODO: convert to SDK address (non-serializable in redux)?
      amount, // TODO: is amount expressed in source chain decimals?
      receipt: {
        from: chain,
        to: config.sdkConverter.toChainV2(toChain as ChainId),
        state: TransferState.SourceInitiated,
        originTxs: [
          {
            chain,
            // TODO: right format for all chains?
            txid: operation.sourceChain.transaction.txHash,
          },
        ],
      } satisfies SourceInitiatedTransferReceipt,
    };
    if (appIds.length === 1) {
      switch (appIds[0]) {
        case PORTAL_APP_ID:
          return {
            ...details,
            route: Route.Bridge,
          };
        // case ETH_BRIDGE_APP_ID:
        // return Route.ETHBridge;
        //case USDT_TRANSFER_APP_ID:
        //  return Route.CCTPManual;
        //case NTT_APP_ID:
        //  return Route.NttManual;
        //case GR_APP_ID:
        //  return Route.GenericRelayer;
        //case MAYAN_APP_ID:
        //  return Route.Mayan;
        //case TBTC_APP_ID:
        // return Route.TBTC;
        //case GATEWAY_APP_ID:
        //  return Route.CosmosGateway;
        //case CCTP_APP_ID:
        //  return Route.CCTPRelay;
      }
    }
    if (appIds.length === 2) {
      if (appIds.includes(PORTAL_APP_ID) && appIds.includes(CONNECT_APP_ID)) {
        return {
          ...details,
          route: Route.Relay,
        };
      }
    }
    /*
    if (isGatewayChain(chain)) {
      return Route.CosmosGateway;
    }

    if (isEvmChain(chain)) {
      const provider = config.wh.mustGetProvider(chain);
      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) throw new Error(`No receipt for ${txHash} on ${chain}`);

      // Check if is CCTP Route (CCTPRelay or CCTPManual)
      const cctpDepositForBurnLog = receipt.logs.find(
        (log) => log.topics[0] === CCTP_LOG_TokenMessenger_DepositForBurn,
      );
      if (cctpDepositForBurnLog) {
        if (
          cctpDepositForBurnLog.topics[3].substring(26).toLowerCase() ===
          config.wh
            .getContracts(chain)
            ?.cctpContracts?.wormholeCCTP?.substring(2)
            .toLowerCase()
        )
          return Route.CCTPRelay;
        else return Route.CCTPManual;
      }

      // Check if is Ntt Route (NttRelay or NttManual)
      if (
        receipt.logs.some((log) => log.topics[0] === TRANSFER_SENT_EVENT_TOPIC)
      ) {
        const { relayingType } = await getMessageEvm(txHash, chain, receipt);
        return relayingType === NttRelayingType.Manual
          ? Route.NttManual
          : Route.NttRelay;
      }
    }

    if (chain === 'solana') {
      // Check if is Ntt Route (NttRelay or NttManual)
      const connection = solanaContext().connection;
      if (!connection) throw new Error('Connection not found');
      const tx = await connection.getParsedTransaction(txHash);
      if (!tx) throw new Error('Transaction not found');
      if (
        tx.transaction.message.instructions.some((ix) =>
          getNttManagerConfigByAddress(ix.programId.toString(), chain),
        )
      ) {
        const { relayingType } = await getMessageSolana(txHash);
        return relayingType === NttRelayingType.Manual
          ? Route.NttManual
          : Route.NttRelay;
      }
    }

    if (chain === 'solana') {
      const { connection, contracts } = config.wh.getContext(
        chain,
      ) as SolanaContext<WormholeContext>;
      if (!connection) throw new Error('No connection for Solana');
      const { cctpTokenMessenger } =
        contracts.getContracts(chain)?.cctpContracts || {};
      if (!cctpTokenMessenger) {
        throw new Error('No CCTP contracts on Solana');
      }
      const tx = await connection.getTransaction(txHash);
      const isCctp = tx?.transaction.message.instructions.some((ix) => {
        return tx.transaction.message.accountKeys[ix.programIdIndex].equals(
          new PublicKey(cctpTokenMessenger),
        );
      });
      // TODO: change when cctp relayer for solana is up
      if (isCctp) return Route.CCTPManual;
    }

    const message = await getMessage(txHash, chain);

    if (message.toChain === 'sei') {
      return Route.Relay;
    }

    if (isGatewayChain(message.fromChain) || isGatewayChain(message.toChain)) {
      return Route.CosmosGateway;
    }

    const token = getTokenById(message.tokenId);
    const tokenSymbol = token?.symbol;
    if (tokenSymbol === 'tBTC') {
      return Route.TBTC;
    }

    const portico = config.wh.getContracts(chain)?.portico;
    if (portico && message.fromAddress) {
      if (isEqualCaseInsensitive(message.fromAddress, portico)) {
        if (tokenSymbol === 'ETH' || tokenSymbol === 'WETH') {
          return Route.ETHBridge;
        }
        if (tokenSymbol === 'wstETH') {
          return Route.wstETHBridge;
        }
        throw new Error(`Unsupported Portico bridge token ${tokenSymbol}`);
      }
    }

    return message.payloadID === PayloadType.Automatic
      ? Route.Relay
      : Route.Bridge;
      */

    // TODO SDKV2
    // relied on getMessage
    // return Route.Bridge;
    throw new Error('No route found for txHash');
  }

  async isRouteSupported(
    route: Route,
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    try {
      if (!config.routes.includes(route)) {
        return false;
      }

      const r = this.getRoute(route);
      return await r.isRouteSupported(
        sourceToken,
        destToken,
        amount,
        sourceChain,
        destChain,
      );
    } catch (e) {
      // TODO is this the right place to try/catch these?
      // or deeper inside SDKv2Route?
      return false;
    }
  }
  async isRouteAvailable(
    route: Route,
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<boolean> {
    if (!config.routes.includes(route)) {
      return false;
    }

    const r = this.getRoute(route);
    return await r.isRouteAvailable(
      sourceToken,
      destToken,
      amount,
      sourceChain,
      destChain,
      options,
    );
  }

  allSupportedChains(): ChainName[] {
    const supported = new Set<ChainName>();
    for (const key in config.chains) {
      const chainName = key as ChainName;
      for (const route of config.routes) {
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
    for (const route of config.routes) {
      const r = this.getRoute(route as Route);

      try {
        const sourceTokens = await r.supportedSourceTokens(
          config.tokensArr,
          destToken,
          sourceChain,
          destChain,
        );

        for (const token of sourceTokens) {
          supported[token.key] = token;
        }
      } catch (e) {
        console.error(e);
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
    for (const route of config.routes) {
      const r = this.getRoute(route as Route);

      try {
        const destTokens = await r.supportedDestTokens(
          config.tokensArr,
          sourceToken,
          sourceChain,
          destChain,
        );

        for (const token of destTokens) {
          supported[token.key] = token;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return Object.values(supported);
  }

  isSupportedChain(route: Route, chain: ChainName): boolean {
    const r = this.getRoute(route);
    return r.isSupportedChain(chain);
  }

  async computeReceiveAmount(
    route: Route,
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeReceiveAmount(
      sendAmount,
      token,
      destToken,
      sendingChain,
      recipientChain,
      options,
    );
  }

  async computeReceiveAmountWithFees(
    route: Route,
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeReceiveAmountWithFees(
      sendAmount,
      token,
      destToken,
      sendingChain,
      recipientChain,
      options,
    );
  }

  async computeSendAmount(
    route: Route,
    receiveAmount: number | undefined,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeSendAmount(receiveAmount, options);
  }

  async validate(
    route: Route,
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    options: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return await r.validate(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      options,
    );
  }

  /*
   * TODO SDKV2
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
  */

  async send(
    route: Route,
    token: TokenConfig,
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    destToken: string,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<[routes.Route<Network>, routes.Receipt]> {
    const r = this.getRoute(route);
    return await r.send(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      destToken,
      options,
    );
  }

  async getPreview(
    route: Route,
    token: TokenConfig,
    destToken: TokenConfig,
    amount: number,
    sendingChain: ChainName | ChainId,
    recipientChain: ChainName | ChainId,
    sendingGasEst: string,
    claimingGasEst: string,
    receiveAmount: string,
    tokenPrices: TokenPrices,
    relayerFee?: RelayerFee,
    receiveNativeAmt?: number,
  ): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return await r.getPreview(
      token,
      destToken,
      amount,
      sendingChain,
      recipientChain,
      sendingGasEst,
      claimingGasEst,
      receiveAmount,
      tokenPrices,
      relayerFee,
      receiveNativeAmt,
    );
  }

  async getForeignAsset(
    route: Route,
    tokenId: TokenId,
    chain: ChainName | ChainId,
    destToken?: TokenConfig,
  ): Promise<string | null> {
    const r = this.getRoute(route);
    return r.getForeignAsset(tokenId, chain, destToken);
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
  ): Promise<TransferDestInfo> {
    const r = this.getRoute(route);
    return r.getTransferDestInfo(params);
  }

  tryFetchRedeemTx(
    route: Route,
    txData: ParsedMessage,
  ): Promise<string | undefined> {
    const r = this.getRoute(route);
    return r.tryFetchRedeemTx(txData);
  }
}

const RouteOperator = new Operator();
export default RouteOperator;
