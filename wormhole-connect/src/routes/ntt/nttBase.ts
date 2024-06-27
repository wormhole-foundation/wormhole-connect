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
import { isEvmChain, toChainId, toChainName } from 'utils/sdk';
import {
  MAX_DECIMALS,
  calculateUSDPrice,
  getDisplayName,
  getTokenById,
  getTokenDecimals,
  removeDust,
  toNormalizedDecimals,
} from 'utils';
import { getNttManager } from './chains';
import { InboundQueuedTransfer } from './types';
import {
  ContractIsPausedError,
  DestinationContractIsPausedError,
} from './errors';
import { WormholeTransceiver, getMessageEvm } from './chains/evm';
import { NttManagerSolana, getMessageSolana } from './chains/solana';
import { NO_INPUT } from 'utils/style';
import { estimateAverageGasFee } from '../utils';
import config from 'config';
import {
  getNttGroupKey,
  getNttManagerAddress,
  getNttManagerConfigByAddress,
  isNttToken,
  isNttTokenPair,
} from 'utils/ntt';

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
    if (
      !token ||
      !isNttToken(token) ||
      !sourceChain ||
      !this.isSupportedToken(token, sourceChain)
    ) {
      return false;
    }
    if (
      destToken &&
      ((destChain && !this.isSupportedToken(destToken, destChain)) ||
        !isNttTokenPair(destToken, token))
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
    if (
      !token ||
      !isNttToken(token) ||
      !destChain ||
      !this.isSupportedToken(token, destChain)
    ) {
      return false;
    }
    if (
      sourceToken &&
      ((sourceChain && !this.isSupportedToken(sourceToken, sourceChain)) ||
        !isNttTokenPair(sourceToken, token))
    ) {
      return false;
    }
    return true;
  }

  isSupportedToken(token: TokenConfig, chain: ChainName | ChainId): boolean {
    return (
      this.isSupportedChain(token.nativeChain) &&
      isNttToken(token) &&
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
      const gasLimit = this.TYPE === Route.NttManual ? 250_000 : 300_000;
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
    if (token === 'native') throw new Error('invalid token');
    const tokenConfig = getTokenById(token);
    if (!tokenConfig || !isNttToken(tokenConfig))
      throw new Error('invalid token');
    const destTokenConfig = config.tokens[destToken];
    if (!isNttToken(destTokenConfig)) throw new Error('invalid dest token');
    const nttGroupKey = getNttGroupKey(tokenConfig, destTokenConfig);
    if (!nttGroupKey) throw new Error('invalid token pair');
    const recipientNttManagerAddress = getNttManagerAddress(
      destTokenConfig,
      nttGroupKey,
    );
    if (!recipientNttManagerAddress)
      throw new Error('recipient ntt manager not found');
    if (
      await getNttManager(recipientChain, recipientNttManagerAddress).isPaused()
    ) {
      throw new DestinationContractIsPausedError();
    }
    const nttManagerAddress = getNttManagerAddress(tokenConfig, nttGroupKey);
    if (!nttManagerAddress) throw new Error('ntt manager not found');
    const nttManager = getNttManager(sendingChain, nttManagerAddress);
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
    if (!isSignedNttMessage(signedMessage))
      throw new Error('Not a signed NttMessage');
    const { recipientNttManager, vaa } = signedMessage;
    const nttManager = getNttManager(chain, recipientNttManager);
    if (await nttManager.isPaused()) throw new ContractIsPausedError();
    const nttConfig = getNttManagerConfigByAddress(
      recipientNttManager,
      toChainName(chain),
    );
    if (!nttConfig) throw new Error('ntt config not found');
    if (isEvmChain(chain)) {
      if (nttConfig.transceivers[0].type !== 'wormhole')
        throw new Error('Unsupported transceiver type');
      const transceiver = new WormholeTransceiver(
        chain,
        nttConfig.transceivers[0].address,
      );
      return await transceiver.receiveMessage(vaa, payer);
    } else if (toChainName(chain) === 'solana')
      return await (nttManager as NttManagerSolana).receiveMessage(vaa, payer);
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
    destToken?: TokenConfig,
  ): Promise<string | null> {
    return destToken?.tokenId?.address || null;
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
    const vaa = await fetchVaa(unsigned);

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
      /*
       TODO SDKV2
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
      */
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
