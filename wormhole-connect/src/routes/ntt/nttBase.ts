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
  TransferDestInfoBaseParams,
  TransferDestInfo,
  isSignedNttMessage,
} from '../types';
import { fetchVaa } from 'utils/vaa';
import { hexlify, parseUnits } from 'ethers/lib/utils.js';
import { BaseRoute } from '../bridge';
import { isEvmChain, toChainName, wh } from 'utils/sdk';
import { CHAINS, TOKENS } from 'config';
import {
  MAX_DECIMALS,
  calculateUSDPrice,
  getDisplayName,
  getTokenById,
  getTokenDecimals,
  removeDust,
  toNormalizedDecimals,
} from 'utils';
import { getNativeVersionOfToken } from 'store/transferInput';
import { getNttManager, getWormholeTransceiver } from './platforms';
import { InboundQueuedTransfer } from './types';
import {
  ContractIsPausedError,
  DestinationContractIsPausedError,
} from './errors';
import { getMessageEvm } from './platforms/evm';
import { getMessageSolana } from './platforms/solana';
import { WormholeTransceiverMessage } from './payloads/wormhole';
import { NttManagerMessage } from './payloads/common';
import { NativeTokenTransfer } from './payloads/transfers';
import { formatGasFee } from 'routes/utils';
import { NO_INPUT } from 'utils/style';

export abstract class NttBase extends BaseRoute {
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
      !!token.ntt &&
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
    if (!tokenConfig?.ntt) {
      throw new Error('invalid token');
    }
    const destTokenConfig = TOKENS[destToken];
    if (!destTokenConfig?.ntt) {
      throw new Error('invalid dest token');
    }
    // prevent sending to a paused chain
    if (
      await getNttManager(
        recipientChain,
        destTokenConfig.ntt.nttManager,
      ).isPaused()
    ) {
      throw new DestinationContractIsPausedError();
    }
    const nttManager = getNttManager(sendingChain, tokenConfig.ntt.nttManager);
    if (await nttManager.isPaused()) {
      throw new ContractIsPausedError();
    }
    const decimals = getTokenDecimals(
      wh.toChainId(sendingChain),
      tokenConfig.tokenId,
    );
    // remove any dust before sending
    const sendAmount = removeDust(parseUnits(amount, decimals), decimals);
    console.log('sendAmount', sendAmount.toString());
    const shouldSkipRelayerSend = this.TYPE !== Route.NttRelay;
    return await nttManager.send(
      token,
      senderAddress,
      recipientAddress,
      sendAmount.toBigInt(),
      recipientChain,
      shouldSkipRelayerSend,
    );
  }

  async redeem(
    chain: ChainName | ChainId,
    signedMessage: SignedMessage,
    payer: string,
  ): Promise<string> {
    if (!isSignedNttMessage(signedMessage)) {
      throw new Error('Not a signed NttMessage');
    }
    const { recipientNttManager, receivedTokenKey, vaa } = signedMessage;
    const nttManager = getNttManager(chain, recipientNttManager);
    if (await nttManager.isPaused()) {
      throw new ContractIsPausedError();
    }
    const wormholeTransceiver =
      TOKENS[receivedTokenKey]?.ntt?.wormholeTransceiver;
    if (!wormholeTransceiver) {
      throw new Error('WormholeTransceiver not configured');
    }
    return await getWormholeTransceiver(
      chain,
      wormholeTransceiver,
    ).receiveMessage(vaa, payer);
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
    nttManagerAddress: string,
  ): Promise<string> {
    return await getNttManager(
      chain,
      nttManagerAddress,
    ).getCurrentOutboundCapacity();
  }

  async getCurrentInboundCapacity(
    chain: ChainId | ChainName,
    nttManagerAddress: string,
    fromChain: ChainId | ChainName,
  ): Promise<string> {
    return await getNttManager(
      chain,
      nttManagerAddress,
    ).getCurrentInboundCapacity(fromChain);
  }

  async getInboundQueuedTransfer(
    chain: ChainName | ChainId,
    nttManagerAddress: string,
    transceiverMessage: string,
    fromChain: ChainName | ChainId,
  ): Promise<InboundQueuedTransfer | undefined> {
    const nttManagerMessage = WormholeTransceiverMessage.deserialize(
      Buffer.from(transceiverMessage.slice(2), 'hex'),
      (a) => NttManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    ).ntt_managerPayload;
    return await getNttManager(
      chain,
      nttManagerAddress,
    ).getInboundQueuedTransfer(fromChain, nttManagerMessage);
  }

  async completeInboundQueuedTransfer(
    chain: ChainName | ChainId,
    nttManagerAddress: string,
    transceiverMessage: string,
    fromChain: ChainName | ChainId,
    payer: string,
  ): Promise<string> {
    const nttManagerMessage = WormholeTransceiverMessage.deserialize(
      Buffer.from(transceiverMessage.slice(2), 'hex'),
      (a) => NttManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    ).ntt_managerPayload;
    const nttManager = getNttManager(chain, nttManagerAddress);
    if (await nttManager.isPaused()) {
      throw new ContractIsPausedError();
    }
    return await nttManager.completeInboundQueuedTransfer(
      fromChain,
      nttManagerMessage,
      payer,
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
    if (isEvmChain(chain)) {
      return getMessageEvm(tx, chain);
    }
    if (wh.toChainName(chain) === 'solana') {
      return getMessageSolana(tx);
    }
    throw new Error('Unsupported chain');
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
    return undefined;
  }

  // The transfer is considered completed when the message is executed
  // and not inbound queued
  async isTransferCompleted(
    chain: ChainName | ChainId,
    signedMessage: SignedNTTMessage,
  ): Promise<boolean> {
    if (!isSignedNttMessage(signedMessage)) {
      throw new Error('Invalid signed message');
    }
    const { fromChain, recipientNttManager, transceiverMessage } =
      signedMessage;
    const nttManagerMessage = WormholeTransceiverMessage.deserialize(
      Buffer.from(transceiverMessage.slice(2), 'hex'),
      (a) => NttManagerMessage.deserialize(a, NativeTokenTransfer.deserialize),
    ).ntt_managerPayload;
    const nttManager = getNttManager(chain, recipientNttManager);
    const isMessageExecuted = await nttManager.isMessageExecuted(
      fromChain,
      nttManagerMessage,
    );
    if (isMessageExecuted) {
      const queuedTransfer = await nttManager.getInboundQueuedTransfer(
        fromChain,
        nttManagerMessage,
      );
      return !queuedTransfer;
    }
    return false;
  }

  async getTransferDestInfo<T extends TransferDestInfoBaseParams>(
    params: T,
  ): Promise<TransferDestInfo> {
    const {
      txData: { receivedTokenKey, amount, tokenDecimals, toChain },
      tokenPrices,
      gasEstimate,
      receiveTx,
    } = params;
    const token = TOKENS[receivedTokenKey];
    const formattedAmt = toNormalizedDecimals(
      amount,
      tokenDecimals,
      MAX_DECIMALS,
    );
    const result = {
      route: this.TYPE,
      displayData: [
        {
          title: 'Amount',
          value: `${formattedAmt} ${getDisplayName(token)}`,
          valueUSD: calculateUSDPrice(formattedAmt, tokenPrices, token),
        },
      ],
    };
    if (this.TYPE === Route.NttManual) {
      const { gasToken } = CHAINS[toChain]!;
      let gas = gasEstimate;
      if (receiveTx) {
        // TODO: this needs to call the manager?
        const gasFee = await wh.getTxGasFee(toChain, receiveTx);
        if (gasFee) {
          gas = formatGasFee(toChain, gasFee);
        }
      }
      result.displayData.push({
        title: receiveTx ? 'Gas fee' : 'Gas estimate',
        value: gas ? `${gas} ${getDisplayName(TOKENS[gasToken])}` : NO_INPUT,
        valueUSD: calculateUSDPrice(gas, tokenPrices, TOKENS[gasToken]),
      });
    }
    return result;
  }
}
