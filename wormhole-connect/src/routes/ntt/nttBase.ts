import { BigNumber } from 'ethers';
import {
  ChainId,
  ChainName,
  TokenId,
} from '@wormhole-foundation/wormhole-connect-sdk';
import { Route, TokenConfig } from 'config/types';
import {
  SignedMessage,
  UnsignedMessage,
  UnsignedNTTMessage,
  SignedNTTMessage,
  isSignedNTTMessage,
} from '../types';
import { fetchVaa } from 'utils/vaa';
import { hexlify, parseUnits } from 'ethers/lib/utils.js';
import { BaseRoute } from '../bridge';
import { isEvmChain, toChainName, wh } from 'utils/sdk';
import { TOKENS } from 'config';
import { getTokenById, getTokenDecimals } from 'utils';
import { getNativeVersionOfToken } from 'store/transferInput';
import { getPlatform } from './platforms';
import { InboundQueuedTransfer } from './types';
import { DestContractIsPausedError } from './errors';

export abstract class NTTBase extends BaseRoute {
  isSupportedChain(chain: ChainName): boolean {
    return isEvmChain(chain) || chain === 'solana';
  }

  async isSupportedSourceToken(
    token?: TokenConfig,
    destToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token || !sourceChain || !this.isSupportedToken(token, sourceChain)) {
      return false;
    }
    if (
      destChain &&
      destToken &&
      !this.isSupportedToken(destToken, destChain)
    ) {
      return false;
    }
    return true;
  }

  async isSupportedDestToken(
    token?: TokenConfig,
    sourceToken?: TokenConfig,
    sourceChain?: ChainName | ChainId,
    destChain?: ChainName | ChainId,
  ): Promise<boolean> {
    if (!token || !destChain || !this.isSupportedToken(token, destChain)) {
      return false;
    }
    if (
      sourceChain &&
      sourceToken &&
      !this.isSupportedToken(sourceToken, sourceChain)
    ) {
      return false;
    }
    return true;
  }

  isSupportedToken(token: TokenConfig, chain: ChainName | ChainId): boolean {
    return (
      this.isSupportedChain(token.nativeChain) &&
      !!token.nttManagerAddress &&
      toChainName(chain) === token.nativeChain
    );
  }

  async isRouteSupported(
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
  ): Promise<boolean> {
    return Promise.all([
      this.isSupportedChain(wh.toChainName(sourceChain)),
      this.isSupportedChain(wh.toChainName(destChain)),
      this.isSupportedSourceToken(
        TOKENS[sourceToken],
        TOKENS[destToken],
        sourceChain,
        destChain,
      ),
      this.isSupportedDestToken(
        TOKENS[destToken],
        TOKENS[sourceToken],
        sourceChain,
        destChain,
      ),
    ]).then((results) => results.every((result) => result));
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
    throw new Error('not implemented');
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    throw new Error('not implemented');
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
    if (token === 'native') {
      throw new Error('invalid token');
    }
    const tokenConfig = getTokenById(token);
    if (!tokenConfig?.nttManagerAddress) {
      throw new Error('invalid token');
    }
    const destTokenConfig = TOKENS[destToken];
    if (!destTokenConfig?.nttManagerAddress) {
      throw new Error('invalid dest token');
    }
    // prevent sending to a paused chain
    if (
      await getPlatform(
        recipientChain,
        destTokenConfig.nttManagerAddress,
      ).isPaused()
    ) {
      throw new DestContractIsPausedError();
    }
    const decimals = getTokenDecimals(
      wh.toChainId(sendingChain),
      tokenConfig.tokenId,
    );
    const parsedAmount = parseUnits(amount, decimals).toBigInt();
    return getPlatform(sendingChain, tokenConfig.nttManagerAddress).send(
      token,
      recipientAddress,
      parsedAmount,
      recipientChain,
      this.TYPE === Route.NTTRelay,
    );
  }

  async redeem(
    chain: ChainName | ChainId,
    signedMessage: SignedMessage,
    payer: string,
  ): Promise<string> {
    if (!isSignedNTTMessage(signedMessage)) {
      throw new Error('Invalid message');
    }
    const { destManagerAddress, vaa } = signedMessage;
    return getPlatform(chain, destManagerAddress).receiveMessage(vaa);
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
  ): Promise<BigNumber> {
    return BigNumber.from(0);
  }

  async getCurrentOutboundCapacity(
    chain: ChainId | ChainName,
    managerAddress: string,
  ): Promise<string> {
    return getPlatform(chain, managerAddress).getCurrentOutboundCapacity();
  }

  async getCurrentInboundCapacity(
    chain: ChainId | ChainName,
    managerAddress: string,
    fromChain: ChainId | ChainName,
  ): Promise<string> {
    return getPlatform(chain, managerAddress).getCurrentInboundCapacity(
      fromChain,
    );
  }

  async getInboundQueuedTransfer(
    chain: ChainName | ChainId,
    managerAddress: string,
    messageDigest: string,
  ): Promise<InboundQueuedTransfer | undefined> {
    return getPlatform(chain, managerAddress).getInboundQueuedTransfer(
      messageDigest,
    );
  }

  async completeInboundQueuedTransfer(
    chain: ChainName | ChainId,
    managerAddress: string,
    messageDigest: string,
  ): Promise<string> {
    return getPlatform(chain, managerAddress).completeInboundQueuedTransfer(
      messageDigest,
    );
  }

  async getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const tokenConfig = getTokenById(token);
    if (!tokenConfig) {
      throw new Error('invalid token');
    }
    const key = getNativeVersionOfToken(
      tokenConfig.symbol,
      wh.toChainName(chain),
    );
    return TOKENS[key]?.tokenId?.address || null;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedNTTMessage> {
    return getPlatform(chain, '').getMessage(tx, chain);
  }

  async getSignedMessage(
    unsigned: UnsignedNTTMessage,
  ): Promise<SignedNTTMessage> {
    const vaa = await fetchVaa(unsigned, true);

    if (!vaa) {
      throw new Error('VAA not found');
    }

    return {
      ...unsigned,
      vaa: hexlify(vaa),
    };
  }

  async tryFetchRedeemTx(txData: UnsignedMessage): Promise<string | undefined> {
    throw new Error('Not supported');
  }

  // The transfer is considered completed when the message is executed
  // and there is no inbound queued transfer
  async isTransferCompleted(
    chain: ChainName | ChainId,
    signedMessage: SignedNTTMessage,
  ): Promise<boolean> {
    if (!isSignedNTTMessage(signedMessage)) {
      throw new Error('Invalid signed message');
    }
    const { destManagerAddress, messageDigest } = signedMessage;
    const platform = getPlatform(chain, destManagerAddress);
    const isMessageExecuted = await platform.isMessageExecuted(messageDigest);
    console.log(isMessageExecuted);
    if (isMessageExecuted) {
      const queuedTransfer = await platform.getInboundQueuedTransfer(
        messageDigest,
      );
      return !queuedTransfer;
    }
    return false;
  }
}
