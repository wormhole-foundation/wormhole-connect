import {
  ChainId,
  ChainName,
  MAINNET_CHAINS,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { BigNumber } from 'ethers';
import { hexlify, parseUnits, arrayify } from 'ethers/lib/utils.js';
import config from 'config';
import { Route, TokenConfig } from 'config/types';
import { getTokenDecimals } from 'utils';
import { TransferWallet, postVaa, signAndSendTransaction } from 'utils/wallet';
import {
  UnsignedMessage,
  isSignedWormholeMessage,
  TokenTransferMessage,
  SignedTokenTransferMessage,
  RelayerFee,
} from '../types';
import { BaseRoute } from './baseRoute';
import { adaptParsedMessage } from '../utils';
import { SignedMessage } from '../types';
import { isGatewayChain } from '../../utils/cosmos';
import { fetchVaa } from '../../utils/vaa';
import { getSolanaAssociatedTokenAccount } from 'utils/solana';

export class BridgeRoute extends BaseRoute {
  readonly NATIVE_GAS_DROPOFF_SUPPORTED: boolean = false;
  readonly AUTOMATIC_DEPOSIT: boolean = false;
  readonly TYPE: Route = Route.Bridge;

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    if (!config.routes.includes(Route.Bridge)) {
      return false;
    }

    const sourceTokenConfig = config.tokens[sourceToken];
    const destTokenConfig = config.tokens[destToken];
    if (!sourceChain || !destChain || !sourceTokenConfig || !destTokenConfig)
      return false;
    if (sourceChain === destChain) return false;
    if (isGatewayChain(sourceChain) || isGatewayChain(destChain)) return false;
    if (
      sourceTokenConfig.symbol === 'tBTC' ||
      destTokenConfig.symbol === 'tBTC'
    )
      return false;
    // TODO: probably not true for Solana
    if (destToken === 'native') return false;

    // Special case: Native eth cannot be sent on arbitrum
    if (
      (sourceToken === 'ETHarbitrum' || sourceToken === 'native') &&
      sourceChain === 'arbitrum'
    )
      return false;

    // Special case: OKB cannot be sent on xlayer
    if (
      (sourceToken === 'OKB' || sourceToken === 'native') &&
      sourceChain === 'xlayer'
    )
      return false;

    if (!!sourceTokenConfig.tokenId && sourceToken === destToken) return true;
    if (
      !sourceTokenConfig.tokenId &&
      sourceTokenConfig.wrappedAsset === destToken
    )
      return true;
    return false;
  }

  isSupportedChain(chain: ChainName): boolean {
    // all chains are supported for manual
    return true;
  }

  async computeReceiveAmount(
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: ChainName | undefined,
    recipientChain: ChainName | undefined,
    routeOptions: any,
  ): Promise<number> {
    if (!sendAmount) return 0;
    return sendAmount;
  }
  async computeSendAmount(
    receiveAmount: number | undefined,
    routeOptions: any,
  ): Promise<number> {
    if (!receiveAmount) return 0;
    return receiveAmount;
  }

  async validate(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions: any,
  ): Promise<boolean> {
    throw new Error('not implemented');
  }

  async estimateSendGas(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    routeOptions?: any,
  ): Promise<BigNumber> {
    const recipientAccount =
      config.wh.toChainId(recipientChain) === MAINNET_CHAINS.solana
        ? await getSolanaAssociatedTokenAccount(
            token,
            sendingChain,
            recipientAddress,
          )
        : recipientAddress;
    return await config.wh.estimateSendGas(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAccount,
    );
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    if (!signedMessage)
      throw new Error('Cannot estimate gas without signedVAA');
    if (!isSignedWormholeMessage(signedMessage)) {
      throw new Error('Invalid signed message');
    }
    return await config.wh.estimateClaimGas(
      destChain,
      arrayify(signedMessage.vaa),
    );
  }

  /**
   * These operations have to be implemented in subclasses.
   */
  getMinSendAmount(
    token: TokenId | 'native',
    recipientChain: ChainName | ChainId,
    routeOptions: any,
  ): number {
    return 0;
  }

  async send(
    token: TokenId | 'native',
    amount: string,
    sendingChain: ChainName | ChainId,
    senderAddress: string,
    recipientChain: ChainName | ChainId,
    recipientAddress: string,
    destToken: string,
    routeOptions: any,
  ): Promise<string> {
    const fromChainId = config.wh.toChainId(sendingChain);
    const fromChainName = config.wh.toChainName(sendingChain);
    const decimals = getTokenDecimals(fromChainId, token);
    const parsedAmt = parseUnits(amount, decimals);
    const recipientAccount =
      config.wh.toChainId(recipientChain) === MAINNET_CHAINS.solana
        ? await getSolanaAssociatedTokenAccount(
            token,
            sendingChain,
            recipientAddress,
          )
        : recipientAddress;
    const tx = await config.wh.send(
      token,
      parsedAmt.toString(),
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAccount,
      undefined,
    );
    const txId = await signAndSendTransaction(
      fromChainName,
      tx,
      TransferWallet.SENDING,
    );
    config.wh.registerProviders();
    return txId;
  }

  async redeem(
    destChain: ChainName | ChainId,
    signedMessage: SignedMessage,
    payer: string,
  ): Promise<string> {
    if (!isSignedWormholeMessage(signedMessage)) {
      throw new Error('Invalid signed message');
    }
    // post vaa (solana)
    // TODO: move to context

    const destChainId = config.wh.toChainId(destChain);
    const destChainName = config.wh.toChainName(destChain);
    if (destChainId === MAINNET_CHAINS.solana) {
      const destContext = config.wh.getContext(destChain) as any;
      const connection = destContext.connection;
      if (!connection) throw new Error('no connection');
      const contracts = config.wh.mustGetContracts(destChain);
      if (!contracts.core) throw new Error('contract not found');
      await postVaa(
        connection,
        contracts.core,
        Buffer.from(arrayify(signedMessage.vaa, { allowMissingPrefix: true })),
      );
    }

    const tx = await config.wh.redeem(
      destChain,
      arrayify(signedMessage.vaa),
      undefined,
      payer,
    );
    const txId = await signAndSendTransaction(
      destChainName,
      tx,
      TransferWallet.RECEIVING,
    );
    config.wh.registerProviders();
    return txId;
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
    token: TokenId,
    chain: ChainName | ChainId,
    destToken?: TokenConfig,
  ): Promise<string | null> {
    return config.wh.getForeignAsset(token, chain);
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedMessage> {
    const message = await config.wh.getMessage(tx, chain);
    return adaptParsedMessage(message);
  }

  async getSignedMessage(
    message: TokenTransferMessage,
  ): Promise<SignedTokenTransferMessage> {
    const vaa = await fetchVaa(message);

    if (!vaa) {
      throw new Error('VAA not found');
    }

    return {
      ...message,
      vaa: hexlify(vaa.bytes),
    };
  }

  async tryFetchRedeemTx(txData: UnsignedMessage): Promise<string | undefined> {
    return undefined; // only for automatic routes
  }
}
