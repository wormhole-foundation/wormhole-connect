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
  UnsignedNttMessage,
  SignedNttMessage,
  TransferDestInfoBaseParams,
  TransferDestInfo,
  isSignedNttMessage,
  RelayerFee,
} from '../types';
import { fetchVaa } from 'utils/vaa';
import { hexlify, parseUnits } from 'ethers/lib/utils.js';
import { BaseRoute } from '../bridge';
import { isEvmChain, solanaContext, toChainId, toChainName } from 'utils/sdk';
import {
  MAX_DECIMALS,
  calculateUSDPrice,
  getDisplayName,
  getTokenById,
  getTokenDecimals,
  removeDust,
  toNormalizedDecimals,
} from 'utils';
import { getNttToken } from 'store/transferInput';
import { getNttManager } from './platforms';
import { InboundQueuedTransfer } from './types';
import {
  ContractIsPausedError,
  DestinationContractIsPausedError,
} from './errors';
import { WormholeTransceiver, getMessageEvm } from './platforms/evm';
import { NttManagerSolana, getMessageSolana } from './platforms/solana';
import { formatGasFee } from 'routes/utils';
import { NO_INPUT } from 'utils/style';
import { estimateAverageGasFee } from 'utils/gas';
import config from 'config';

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
      !this.isSupportedToken(destToken, destChain) &&
      token.symbol === destToken.symbol
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
      !this.isSupportedToken(sourceToken, sourceChain) &&
      token.symbol === sourceToken.symbol
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
    return await Promise.all([
      this.isSupportedChain(toChainName(sourceChain)),
      this.isSupportedChain(toChainName(destChain)),
      this.isSupportedSourceToken(
        config.tokens[sourceToken],
        config.tokens[destToken],
        sourceChain,
        destChain,
      ),
      this.isSupportedDestToken(
        config.tokens[destToken],
        config.tokens[sourceToken],
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
    if (isEvmChain(sendingChain)) {
      const gasLimit = this.TYPE === Route.NttManual ? 200_000 : 250_000;
      return await estimateAverageGasFee(sendingChain, gasLimit);
    } else if (toChainName(sendingChain) === 'solana') {
      return BigNumber.from(10_000);
    }
    throw new Error('Unsupported chain');
  }

  async estimateClaimGas(
    destChain: ChainName | ChainId,
    signedMessage?: SignedMessage,
  ): Promise<BigNumber> {
    if (this.TYPE === Route.NttRelay) {
      // relayer pays claim gas
      return BigNumber.from(0);
    }
    if (isEvmChain(destChain)) {
      const gasLimit = 300_000;
      return await estimateAverageGasFee(destChain, gasLimit);
    } else if (toChainName(destChain) === 'solana') {
      return BigNumber.from(65_000); // TODO: check this
    }
    throw new Error('Unsupported chain');
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
    const destTokenConfig = config.tokens[destToken];
    if (!destTokenConfig?.ntt) {
      throw new Error('invalid dest token');
    }
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
      toChainId(sendingChain),
      tokenConfig.tokenId,
    );
    const sendAmount = removeDust(parseUnits(amount, decimals), decimals);
    if (sendAmount.isZero()) {
      throw new Error('Amount too low');
    }
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
    const nttConfig = config.tokens[receivedTokenKey]?.ntt;
    if (!nttConfig) {
      throw new Error('ntt config not found');
    }
    if (isEvmChain(chain)) {
      const transceiver = new WormholeTransceiver(
        chain,
        nttConfig.wormholeTransceiver,
      );
      return await transceiver.receiveMessage(vaa, payer);
    }
    if (toChainName(chain) === 'solana') {
      return await (nttManager as NttManagerSolana).receiveMessage(vaa, payer);
    }
    throw new Error('Unsupported chain');
  }

  async getRelayerFee(
    sourceChain: ChainName | ChainId,
    destChain: ChainName | ChainId,
    token: string,
    destToken: string,
  ): Promise<RelayerFee | null> {
    return null;
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

  async getRateLimitDuration(
    chain: ChainId | ChainName,
    nttManagerAddress: string,
  ): Promise<number> {
    return await getNttManager(chain, nttManagerAddress).getRateLimitDuration();
  }

  async getInboundQueuedTransfer(
    chain: ChainName | ChainId,
    nttManagerAddress: string,
    messageDigest: string,
  ): Promise<InboundQueuedTransfer | undefined> {
    return await getNttManager(
      chain,
      nttManagerAddress,
    ).getInboundQueuedTransfer(messageDigest);
  }

  async completeInboundQueuedTransfer(
    chain: ChainName | ChainId,
    nttManagerAddress: string,
    messageDigest: string,
    recipientAddress: string,
    payer: string,
  ): Promise<string> {
    const nttManager = getNttManager(chain, nttManagerAddress);
    if (await nttManager.isPaused()) {
      throw new ContractIsPausedError();
    }
    return await nttManager.completeInboundQueuedTransfer(
      messageDigest,
      recipientAddress,
      payer,
    );
  }

  async getForeignAsset(
    token: TokenId,
    chain: ChainName | ChainId,
  ): Promise<string | null> {
    const tokenConfig = getTokenById(token);
    if (!tokenConfig?.ntt) {
      throw new Error('invalid token');
    }
    const key = getNttToken(tokenConfig.ntt.groupId, chain);
    return config.tokens[key]?.tokenId?.address || null;
  }

  async getMessage(
    tx: string,
    chain: ChainName | ChainId,
  ): Promise<UnsignedNttMessage> {
    if (isEvmChain(chain)) {
      return await getMessageEvm(tx, chain);
    }
    if (toChainName(chain) === 'solana') {
      return await getMessageSolana(tx);
    }
    throw new Error('Unsupported chain');
  }

  async getSignedMessage(
    unsigned: UnsignedNttMessage,
  ): Promise<SignedNttMessage> {
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

  async isTransferCompleted(
    chain: ChainName | ChainId,
    signedMessage: SignedNttMessage,
  ): Promise<boolean> {
    if (!isSignedNttMessage(signedMessage)) {
      throw new Error('Invalid signed message');
    }
    const { recipientNttManager, messageDigest } = signedMessage;
    const nttManager = getNttManager(chain, recipientNttManager);
    return await nttManager.isTransferCompleted(messageDigest);
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
    const token = config.tokens[receivedTokenKey];
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
      const { gasToken } = config.chains[toChain]!;
      let gas = gasEstimate;
      if (receiveTx) {
        if (isEvmChain(toChain)) {
          const gasFee = await config.wh.getTxGasFee(toChain, receiveTx);
          if (gasFee) {
            gas = formatGasFee(toChain, gasFee);
          }
        } else if (toChainName(toChain) === 'solana') {
          const connection = solanaContext().connection;
          if (!connection) throw new Error('Connection not found');
          const tx = await connection.getParsedTransaction(receiveTx);
          if (tx?.meta?.fee) {
            gas = formatGasFee(toChain, BigNumber.from(tx.meta.fee));
          }
        }
      }
      result.displayData.push({
        title: receiveTx ? 'Gas fee' : 'Gas estimate',
        value: gas
          ? `${gas} ${getDisplayName(config.tokens[gasToken])}`
          : NO_INPUT,
        valueUSD: calculateUSDPrice(gas, tokenPrices, config.tokens[gasToken]),
      });
    }
    return result;
  }
}
