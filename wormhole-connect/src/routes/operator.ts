import { PublicKey } from '@solana/web3.js';
import {
  ChainId,
  ChainName,
  TokenId,
  SolanaContext,
  WormholeContext,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';

import config from 'config';
import { TokenConfig, Route } from 'config/types';
import { PayloadType, getMessage, isEvmChain, solanaContext } from 'utils/sdk';
import { isGatewayChain } from 'utils/cosmos';
import { RelayRoute } from './relay';
// import { HashflowRoute } from './hashflow';
import { RouteAbstract } from './abstracts/routeAbstract';
import {
  UnsignedMessage,
  SignedMessage,
  TransferDisplayData,
  TransferInfoBaseParams,
  TransferDestInfo,
  NttRelayingType,
  RelayerFee,
} from './types';
import { CCTP_LOG_TokenMessenger_DepositForBurn } from './cctpManual';
import { getTokenById, isEqualCaseInsensitive } from 'utils';
import { TokenPrices } from 'store/tokenPrices';
import { getMessageEvm, TRANSFER_SENT_EVENT_TOPIC } from './ntt/chains/evm';
import { getMessageSolana } from './ntt/chains/solana';
import { getNttManagerConfigByAddress } from 'utils/ntt';

import { getRoute } from './mappings';

export class Operator {
  getRoute(route: Route): RouteAbstract {
    return getRoute(route);
  }

  async getRouteFromTx(txHash: string, chain: ChainName): Promise<Route> {
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
      for (const token of config.tokensArr) {
        const { key } = token;
        const alreadySupported = supported[key];
        if (!alreadySupported) {
          const isSupported = await this.isSupportedSourceToken(
            route as Route,
            config.tokens[key],
            destToken,
            sourceChain,
            destChain,
          );
          if (isSupported) {
            supported[key] = config.tokens[key];
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
    for (const route of config.routes) {
      // Some routes support the much more efficient supportedDestTokens method
      // Use it when it's available

      const r = this.getRoute(route as Route);

      // This is ugly hack TODO clean up with proper types
      try {
        /* @ts-ignore */
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
        // Fall back to less efficient method
        for (const token of config.tokensArr) {
          const { key } = token;
          const alreadySupported = supported[key];
          if (!alreadySupported) {
            const isSupported = await r.isSupportedDestToken(
              token,
              sourceToken,
              sourceChain,
              destChain,
            );

            if (isSupported) {
              supported[key] = config.tokens[key];
            }
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
    token?: TokenConfig,
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!config.routes.includes(route)) {
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

  async computeReceiveAmount(
    route: Route,
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: any,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeReceiveAmount(
      sendAmount,
      token,
      destToken,
      sendingChain,
      recipientChain,
      routeOptions,
    );
  }

  async computeReceiveAmountWithFees(
    route: Route,
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: any,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeReceiveAmountWithFees(
      sendAmount,
      token,
      destToken,
      sendingChain,
      recipientChain,
      routeOptions,
    );
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
    destToken: string,
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
      destToken,
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
    receiveAmount: string,
    tokenPrices: TokenPrices,
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
      receiveAmount,
      tokenPrices,
      routeOptions,
    );
  }

  async getRelayerFee(
    route: Route,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
  ): Promise<RelayerFee | null> {
    const r = this.getRoute(route);
    return r.getRelayerFee(sourceChain, destChain, token, destToken);
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
  ): Promise<TransferDestInfo> {
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
    if (r.AUTOMATIC_DEPOSIT) {
      return (r as RelayRoute).nativeTokenAmount(
        destChain,
        token,
        amount,
        walletAddress,
      );
    } else {
      throw new Error('route does not support native gas dropoff');
    }
  }

  maxSwapAmount(
    route: Route,
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    const r = this.getRoute(route);
    if (r.AUTOMATIC_DEPOSIT) {
      return (r as RelayRoute).maxSwapAmount(destChain, token, walletAddress);
    } else {
      throw new Error('route does not support swap for native gas dropoff');
    }
  }

  async minSwapAmountNative(
    route: Route,
    destChain: ChainName | ChainId,
    token: TokenId,
    walletAddress: string,
  ): Promise<BigNumber> {
    const chainName = config.wh.toChainName(destChain);
    if (chainName === 'solana') {
      const context = solanaContext();
      // an non-existent account cannot be sent less than the rent exempt amount
      // in order to create the wallet, it must be sent at least the rent exemption minimum
      const acctExists =
        (await context.connection!.getAccountInfo(
          new PublicKey(walletAddress),
        )) !== null;
      if (acctExists) return BigNumber.from(0);
      const minBalance =
        await context.connection!.getMinimumBalanceForRentExemption(0);
      return BigNumber.from(minBalance);
    }
    return BigNumber.from(0);
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
